/* eslint-disable camelcase */
// eslint-disable-next-line import/no-extraneous-dependencies
import * as core from "@actions/core";
import { exec } from "child_process";
import getContentEntries from "../contentFrom";
import { checkFileEntries } from "../checkFileEntries";
import formatEntries from "../formatEntries";
import asyncMap from "../async-map";

import { optionsFromFile, mergeAndResolveOptions } from "../getOptions";
import { UnresolvedCheckLinkOptions, FileChecksEntry } from "../types";

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
        "source",
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
    if (v !== "") acc[k] = v;
    return acc;
  }, {}) as UnresolvedCheckLinkOptions;

  return mergeAndResolveOptions([
    inputOptions,
    await optionsFromFile(configFile),
  ]);
}

const combineSegments = (segments: string[], sep: string): string =>
  segments && segments.length > 0 ? segments.join(sep) : undefined;

interface CheckOutput {
  summary: string;
  text_description?: string;
}

const conclude = ({
  success,
  conclusion = success ? "success" : "failure",
  summarySegments,
  descriptionSegments,
  summary = combineSegments(summarySegments, ", "),
  description = combineSegments(descriptionSegments, "\n\n"),
}: {
  success?: boolean;
  conclusion?: "success" | "failure";
  summarySegments?: string[];
  descriptionSegments?: string[];
  summary?: string;
  description?: string;
}) => {
  core.setOutput("conclusion", conclusion);
  const output: CheckOutput = { summary };
  if (description) output.text_description = description;
  core.setOutput("output", JSON.stringify(output));
};

function reduceCheckEntriesToErrors(
  entries: FileChecksEntry[]
): FileChecksEntry[] {
  return entries.reduce((acc, { filePath, checks }) => {
    const failingEntries = checks.filter((check) => !check.pass);
    return failingEntries.length > 0
      ? [
          ...acc,
          {
            filePath,
            checks: failingEntries,
          },
        ]
      : acc;
  }, []);
}

async function main() {
  const gitFetchPromise = new Promise((resolve, reject) => {
    exec("git fetch origin master", (err) => (err ? reject(err) : resolve()));
  });

  const options = await optionsFromCoreInputs();

  console.log("Options:", options);

  const summarySegments = [];
  const descriptionSegments = [];

  const { reportUnusedPatterns } = options;

  await gitFetchPromise;

  const fileEntries = await getContentEntries(options);
  const {
    totalChecks,
    failedChecks,
    entries,
    unusedPatterns,
  } = await checkFileEntries(fileEntries, options);

  if (totalChecks === 0) {
    return conclude({
      summary: "There were no files to check links in.",
      success: true,
    });
  }

  if (failedChecks === 0) {
    return conclude({
      summary: "All links passed the check!",
      success: true,
    });
  }

  if (reportUnusedPatterns && unusedPatterns.length > 0) {
    const patternLines = unusedPatterns
      .map((pattern) => `  - ${pattern}`)
      .join("\n\n");
    summarySegments.push(`Some link patterns were unused`);
    descriptionSegments.push(`# Unused match patterns\n\n${patternLines}`);
    if (reportUnusedPatterns === "only") {
      return conclude({
        summarySegments,
        descriptionSegments,
        success: false,
      });
    }
  }

  const hasError = failedChecks > 0;
  if (hasError) {
    const failEntries = reduceCheckEntriesToErrors(entries);
    summarySegments.push("Some new links failed the check.");
    descriptionSegments.push(
      `# Failed checks\n\n${formatEntries(failEntries, {
        fileFormat: ({ filePath }) => `* ${filePath}\n`,
        linkFormat: ({ link, href, description }) =>
          `  - ${link}${
            href && href !== link ? ` = ${href}` : ""
          } (${description})`,
      })}`
    );
  } else {
    summarySegments.push("All new links passed the check!");
  }

  return conclude({
    summarySegments,
    descriptionSegments,
    success: !hasError,
  });
}
main();
