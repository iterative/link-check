import minimist from "minimist";
import formatEntries from "./formatEntries";
import { checkFileEntries } from "./checkFileEntries";
import { optionsFromFile, mergeAndResolveOptions } from "./getOptions";
import { getUnusedLinkExcludePatterns } from "./checkLink";
import { CheckLinkOptions } from "./types";
import getContentEntries from "./contentFrom/index";

const optionsFromFlags: () => Promise<CheckLinkOptions> = async () => {
  const {
    config,
    source = "git-diff",
    rootURL,
    "file-include-pattern": fileIncludePatterns,
    "file-exclude-pattern": fileExcludePatterns,
    "file-include-pattern-file": fileIncludePatternFiles,
    "file-exclude-pattern-file": fileExcludePatternFiles,
    "link-include-pattern": linkIncludePatterns,
    "link-exclude-pattern": linkExcludePatterns,
    "link-include-pattern-file": linkIncludePatternFiles,
    "link-exclude-pattern-file": linkExcludePatternFiles,
    "always-exit-zero": alwaysExitZero,
    "report-unused-patterns": reportUnusedPatterns,
    verbose,
    "dry-run": dryRun = reportUnusedPatterns === "only",
  }: {
    config?: string;
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
    "report-unused-patterns": boolean | "only";
    verbose: boolean;
    "dry-run": boolean;
  } = minimist(process.argv.slice(2), {
    alias: {
      c: "config",
      s: "source",
      u: "report-unused-patterns",
      r: "rootURL",
      z: "always-exit-zero",
      d: "dry-run",
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

  const argsOptions = {
    source,
    rootURL,
    fileIncludePatterns,
    fileExcludePatterns,
    fileIncludePatternFiles,
    fileExcludePatternFiles,
    linkIncludePatterns,
    linkExcludePatterns,
    linkIncludePatternFiles,
    linkExcludePatternFiles,
    alwaysExitZero,
    reportUnusedPatterns,
    verbose,
    dryRun,
  };

  const fileOptions = await optionsFromFile(config);

  return mergeAndResolveOptions([argsOptions, fileOptions]);
};

async function main() {
  let exitCode = 0;

  const checkLinkOptions = await optionsFromFlags();

  const {
    alwaysExitZero,
    reportUnusedPatterns,
    linkExcludePatterns,
    verbose,
  } = checkLinkOptions;

  if (verbose) console.log("Options:", checkLinkOptions);

  const fileEntries = await getContentEntries(checkLinkOptions);
  const checkedLinks = await checkFileEntries(fileEntries, checkLinkOptions);

  if (checkedLinks.length === 0) {
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
      const unusedLinkExcludePatterns = getUnusedLinkExcludePatterns(
        linkExcludePatterns
      );
      if (unusedLinkExcludePatterns.length > 1) {
        console.log(
          `Some link ignore patterns were unused!\n\n${unusedLinkExcludePatterns.join(
            "\n"
          )}\n`
        );
        if (reportUnusedPatterns === "only") {
          process.exit(alwaysExitZero ? 0 : 2);
        }
      } else if (reportUnusedPatterns === "only") {
        process.exit(0);
      }
    }

    if (failCount > 0) {
      console.log(`${reportBody}\n\n${failCount} links failed.`);
      if (!alwaysExitZero) exitCode = 2;
    } else {
      console.log(`${reportBody}\n\nAll links passed!`);
    }
  }
  process.exit(exitCode);
}

main();
