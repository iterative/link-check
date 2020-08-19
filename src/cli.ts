import minimist from "minimist";
import contentFromGitDiff from "./contentFrom/git-diff";
import contentFromFilesystem from "./contentFrom/filesystem";
import formatEntries from "./formatEntries";
import { checkFileEntries } from "./checkFileEntries";
import patternsFromFiles, { patternsOrGlobstar } from "./getPatternsFromFiles";
import { getUsedExcludePatterns } from "./checkLink";

async function getContentEntries(options: CheckLinkOptions) {
  const { source }: { source: string } = options;
  switch (source) {
    case "git-diff": {
      return contentFromGitDiff(options);
    }
    case "filesystem": {
      return contentFromFilesystem(options);
    }
    default:
      throw new Error(`link-check was provided unexpected source "${source}"!`);
  }
}

async function main() {
  let exitCode = 0;
  const {
    source = "git-diff",
    rootURL,
    "file-include-pattern": argFileIncludePatterns,
    "file-exclude-pattern": argFileExcludePatterns,
    "file-include-pattern-file": fileIncludeFiles,
    "file-exclude-pattern-file": fileExcludeFiles,
    "link-include-pattern": argLinkIncludePatterns,
    "link-exclude-pattern": argLinkExcludePatterns,
    "link-include-pattern-file": linkIncludeFiles,
    "link-exclude-pattern-file": linkExcludeFiles,
    "always-exit-zero": alwaysExitZero,
    "report-unused-patterns": reportUnusedPatterns,
    verbose,
  }: {
    source: "git-diff" | "filesystem";
    rootURL: string;
    "file-include-pattern": string | string[];
    "file-exclude-pattern": string | string[];
    "file-include-pattern-file": string | string[];
    "file-exclude-pattern-file": string | string[];
    "link-include-pattern": string | string[];
    "link-exclude-pattern": string | string[];
    "link-include-pattern-file": string | string[];
    "link-exclude-pattern-file": string | string[];
    "always-exit-zero": boolean;
    "report-unused-patterns": boolean;
    verbose: "boolean";
  } = minimist(process.argv.slice(2), {
    alias: {
      s: "source",
      u: "report-unused-patterns",
      r: "rootURL",
      z: "always-exit-zero",
      li: "link-include-pattern",
      le: "link-exclude-pattern",
      fi: "file-include-pattern",
      fe: "file-exclude-pattern",
      lif: "link-include-pattern-file",
      lef: "link-exclude-pattern-file",
      fif: "file-include-pattern-file",
      fef: "file-exclude-pattern-file",
      v: "verbose",
    },
  });

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

  if (verbose) console.log("Options:", options);

  const fileEntries = await getContentEntries(options);
  const checkedLinks = await checkFileEntries(fileEntries, options);

  if (checkedLinks.length === 0) {
    // eslint-disable-next-line no-console
    console.log("There were no links to check!");
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

    if (reportUnusedPatterns && linkExcludePatterns) {
      const usedLinkExcludePatterns = getUsedExcludePatterns();
      const unusedLinkExcludePatterns = linkExcludePatterns.filter(
        (x) => !usedLinkExcludePatterns.has(x)
      );
      if (unusedLinkExcludePatterns.length > 1) {
        // eslint-disable-next-line no-console
        console.log(
          `Some link ignore patterns were unused!\n\n${unusedLinkExcludePatterns.join(
            "\n"
          )}\n`
        );
      }
    }

    if (failCount > 0) {
      // eslint-disable-next-line no-console
      console.log(`${reportBody}\n\n${failCount} links failed.`);
      if (!alwaysExitZero) exitCode = 2;
    } else {
      // eslint-disable-next-line no-console
      console.log(`${reportBody}\n\nAll links passed!`);
    }
  }
  process.exit(exitCode);
}

main();
