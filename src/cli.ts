import minimist from "minimist";
import contentFromGitDiff from "./contentFrom/git-diff";
import contentFromFilesystem from "./contentFrom/filesystem";
import formatEntries from "./formatEntries";
import { checkFileEntries } from "./checkFileEntries";
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
    "always-exit-zero": alwaysExitZero,
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
    "always-exit-zero": boolean;
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
    linkIncludePatterns: patternsOrGlobstar(linkIncludePatterns),
    linkExcludePatterns,
    fileIncludePatterns: patternsOrGlobstar(fileIncludePatterns),
    fileExcludePatterns,
  };

  const fileEntries = await getContentEntries(options);
  const checkedLinks = await checkFileEntries(fileEntries, options);

  if (checkedLinks.length === 0) {
    // eslint-disable-next-line no-console
    console.log("There were no links to check!");
    process.exit(0);
  } else {
    const reportBody = formatEntries(checkedLinks);
    const failCount = checkedLinks.reduce(
      (fullAcc, { checks }) =>
        fullAcc +
        checks.reduce(
          (fileAcc, check) => (check.pass ? fileAcc : fileAcc + 1),
          0
        ),
      0
    );

    if (failCount > 0) {
      // eslint-disable-next-line no-console
      console.log(`${reportBody}\n\n${failCount} links failed.`);
      process.exit(alwaysExitZero ? 0 : 2);
    } else {
      // eslint-disable-next-line no-console
      console.log(`${reportBody}\n\nAll links passed!`);
      process.exit(0);
    }
  }
}

main();
