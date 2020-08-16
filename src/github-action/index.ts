// eslint-disable-next-line import/no-extraneous-dependencies
import * as core from "@actions/core";
import { exec } from "child_process";
import contentFromGitDiff from "../contentFrom/git-diff";
import { checkFileEntries } from "../checkFileEntries";
import formatEntries from "../formatEntries";
import getPatternsFromFiles, {
  patternsOrGlobstar,
} from "../getPatternsFromFiles";
import buildFilter from "../buildFilter";
import asyncMap from "../async-map";

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

async function main() {
  const gitFetchPromise = new Promise((resolve, reject) => {
    exec("git fetch origin master", (err) => (err ? reject(err) : resolve()));
  });

  const [
    rootURL,

    linkIncludePatternFiles,
    linkIncludePatterns,
    linkExcludePatternFiles,
    linkExcludePatterns,

    fileIncludePatternFiles,
    fileIncludePatterns,
    fileExcludePatternFiles,
    fileExcludePatterns,
  ] = await asyncMap<string, string | string[]>(
    [
      "rootURL",

      "linkIncludePatternFiles",
      "linkIncludePatterns",
      "linkExcludePatternFiles",
      "linkExcludePatterns",

      "fileIncludePatternFiles",
      "fileIncludePatterns",
      "fileExcludePatternFiles",
      "fileExcludePatterns",
    ],
    getInput
  );

  const [
    allLinkIncludePatterns,
    allLinkExcludePatterns,
    allFileIncludePatterns,
    allFileExcludePatterns,
  ] = await getPatternsFromFiles([
    [linkIncludePatternFiles, linkIncludePatterns],
    [linkExcludePatternFiles, linkExcludePatterns],
    [fileIncludePatternFiles, fileIncludePatterns],
    [fileExcludePatternFiles, fileExcludePatterns],
  ]);

  const options = {
    source: "git-diff",
    rootURL: rootURL as string,
    linkFilter: buildFilter(
      patternsOrGlobstar(allLinkIncludePatterns),
      allLinkExcludePatterns
    ),
    fileIncludePatterns: patternsOrGlobstar(allFileIncludePatterns),
    fileExcludePatterns: allFileExcludePatterns,
  };

  await gitFetchPromise;

  const fileEntries = await contentFromGitDiff();
  const checkEntries = await checkFileEntries(fileEntries, options);

  if (checkEntries.length === 0) {
    core.setOutput(
      "output",
      JSON.stringify({
        summary: "There were no files to check links in.",
      })
    );
    core.setOutput("conclusion", "success");
  } else {
    const markdownDescription = `# Link check report\n\n${formatEntries(
      checkEntries,
      {
        linkFormat: ({ link, href, description, pass }) =>
          `  - ${pass ? ":heavy_check_mark:" : ":x:"} ${link}${
            href && href !== link ? ` = ${href}` : ""
          } (${description})`,
      }
    )}`;

    const hasError = checkEntries.some(({ checks }) =>
      checks.some(({ pass }) => !pass)
    );

    core.setOutput(
      "output",
      JSON.stringify({
        summary: hasError
          ? "Some new links failed the check."
          : "All new links passed the check!",
        text_description: markdownDescription,
      })
    );
    core.setOutput("conclusion", hasError ? "failure" : "success");
  }
  process.exit(0);
}
main();
