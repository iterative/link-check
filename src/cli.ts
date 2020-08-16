import minimist from "minimist";
import contentFromGitDiff from "./contentFrom/git-diff";
import contentFromFilesystem from "./contentFrom/filesystem";
import formatEntries from "./formatEntries";
import { checkFileEntries } from "./checkFileEntries";
import buildFilter from "./buildFilter";
import patternsFromFiles, { patternsOrGlobstar } from "./getPatternsFromFiles";

async function getContentEntries(options) {
  const { source }: { source: string } = options;
  switch (source) {
    case "git-diff": {
      return contentFromGitDiff();
    }
    case "filesystem": {
      return contentFromFilesystem(options);
    }
    default:
      throw new Error(`link-check was provided unexpected source "${source}"!`);
  }
}

async function main() {
  const {
    source = "git-diff",
    rootURL,
    "file-include-pattern": argFileIncludePatterns,
    "file-exclude-pattern": argFileExcludePatterns,
    "file-include-file": fileIncludeFiles,
    "file-exclude-file": fileExcludeFiles,
    "link-include-pattern": argLinkIncludePatterns,
    "link-exclude-pattern": argLinkExcludePatterns,
    "link-include-file": linkIncludeFiles,
    "link-exclude-file": linkExcludeFiles,
  }: {
    source: "git-diff" | "filesystem";
    rootURL: string;
    "file-include-pattern": string | string[];
    "file-exclude-pattern": string | string[];
    "file-include-file": string | string[];
    "file-exclude-file": string | string[];
    "link-include-pattern": string | string[];
    "link-exclude-pattern": string | string[];
    "link-include-file": string | string[];
    "link-exclude-file": string | string[];
  } = minimist(process.argv.slice(2));

  const [
    linkIncludePatterns,
    linkExcludePatterns,
    fileIncludePatterns,
    fileExcludePatterns,
  ] = await patternsFromFiles([
    [linkIncludeFiles, argLinkIncludePatterns],
    [linkExcludeFiles, argLinkExcludePatterns],
    [fileIncludeFiles, argFileIncludePatterns],
    [fileExcludeFiles, argFileExcludePatterns],
  ]);

  const options = {
    source,
    rootURL,
    linkFilter: buildFilter(
      patternsOrGlobstar(linkIncludePatterns),
      linkExcludePatterns
    ),
    fileIncludePatterns: patternsOrGlobstar(fileIncludePatterns),
    fileExcludePatterns,
  };

  const fileEntries = await getContentEntries(options);
  const checkedLinks = await checkFileEntries(fileEntries, options);
  const failCount = checkedLinks.reduce(
    (fullAcc, { checks }) =>
      fullAcc +
      checks.reduce(
        (fileAcc, check) => (check.pass ? fileAcc : fileAcc + 1),
        0
      ),
    0
  );

  // eslint-disable-next-line no-console
  console.log(
    `${formatEntries(checkedLinks)}\n\n${
      failCount > 0 ? `${failCount} links failed.` : "All links passed!"
    }`
  );
  process.exit(0);
}

main();
