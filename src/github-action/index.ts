// eslint-disable-next-line import/no-extraneous-dependencies
import * as core from "@actions/core";
import { exec } from "child_process";
import contentFromGitDiff from "../contentFrom/git-diff";
import { checkFileEntries } from "../checkFileEntries";
import formatEntries from "../formatEntries";
import asyncMap from "../async-map";

import { optionsFromFile, mergeAndResolveOptions } from "../getOptions";
import { getUnusedLinkExcludePatterns } from "../checkLink";
import { UnresolvedCheckLinkOptions } from "../types";

async function getInput(inputName: string): Promise<string | string[]> {
  const input = await core.getInput(inputName);
  try {
    return JSON.parse(input);
  } catch (e) {
    if (e instanceof SyntaxError) {
      return input;
    }
    throw e;
  }
}

async function optionsFromCoreInputs() {
  const {
    configFile,
    ...inputOptions
  }: UnresolvedCheckLinkOptions & {
    configFile?: string;
  } = (
    await asyncMap<string, [string, string | string[] | boolean | undefined]>(
      [
        "configFile",
        "rootURL",
        "dryRun",
        "reportUnusedPatterns",

        "linkIncludePatternFiles",
        "linkIncludePatterns",
        "linkExcludePatternFiles",
        "linkExcludePatterns",

        "fileIncludePatternFiles",
        "fileIncludePatterns",
        "fileExcludePatternFiles",
        "fileExcludePatterns",
      ],
      async (name) => [name, await getInput(name)]
    )
  ).reduce((acc, [k, v]) => {
    acc[k] = v;
    return acc;
  }, {}) as UnresolvedCheckLinkOptions;

  return mergeAndResolveOptions([
    inputOptions,
    await optionsFromFile(configFile),
  ]);
}

const combineSegments = (segments: string[], sep: string): string =>
  segments && segments.length > 0 ? segments.join(sep) : undefined;

const conclude = ({
  success,
  conclusion = success ? "success" : "failure",
  summarySegments,
  descriptionSegments,
  summary = combineSegments(summarySegments, ", "),
  description = combineSegments(descriptionSegments, "\n\n"),
  exit = success ? 0 : 2,
}: {
  success?: boolean;
  conclusion?: "success" | "failure";
  summarySegments?: string[];
  descriptionSegments?: string[];
  summary?: string;
  description?: string;
  exit?: number;
}) => {
  core.setOutput("conclusion", conclusion);
  const output = description ? { summary } : { summary, description };
  core.setOutput("output", JSON.stringify(output));
  process.exit(exit);
};

async function main() {
  const gitFetchPromise = new Promise((resolve, reject) => {
    exec("git fetch origin master", (err) => (err ? reject(err) : resolve()));
  });

  const options = await optionsFromCoreInputs();

  const summarySegments = [];
  const descriptionSegments = [];

  const { reportUnusedPatterns, linkExcludePatterns } = options;

  await gitFetchPromise;

  const fileEntries = await contentFromGitDiff(options);
  const checkEntries = await checkFileEntries(fileEntries, options);

  if (checkEntries.length === 0) {
    return conclude({
      summary: "There were no files to check links in.",
      success: true,
    });
  }
  if (reportUnusedPatterns && linkExcludePatterns) {
    const unusedLinkExcludePatterns = getUnusedLinkExcludePatterns(
      linkExcludePatterns
    );
    if (unusedLinkExcludePatterns.length > 1) {
      const patternLines = unusedLinkExcludePatterns
        .map((pattern) => `  - ${pattern}`)
        .join("\n\n");
      summarySegments.push(`Some link patterns were unused`);
      descriptionSegments.push(`# Unused match patterns\n\n${patternLines}`);
    }
    if (reportUnusedPatterns === "only") {
      return conclude({
        summarySegments,
        descriptionSegments,
        success: false,
      });
    }
  }

  const hasError = checkEntries.some(({ checks }) =>
    checks.some(({ pass }) => !pass)
  );
  summarySegments.push(
    hasError
      ? "Some new links failed the check."
      : "All new links passed the check!"
  );

  descriptionSegments.push(
    `# Link check report\n\n${formatEntries(checkEntries, {
      fileFormat: ({ checks, filePath }) =>
        `* ${
          checks.some((check) => !check.pass) ? ":x:" : ":heavy_check_mark:"
        }: ${filePath}\n`,
      linkFormat: ({ link, href, description, pass }) =>
        `  - ${pass ? ":heavy_check_mark:" : ":x:"} ${link}${
          href && href !== link ? ` = ${href}` : ""
        } (${description})`,
    })}`
  );

  return conclude({
    summarySegments,
    descriptionSegments,
    success: !hasError,
  });
}
main();
