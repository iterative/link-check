import minimist from "minimist";
import formatEntries from "./formatEntries";
import { checkFileEntries } from "./checkFileEntries";
import { optionsFromFile, mergeAndResolveOptions } from "./getOptions";
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
  const outputSegments = [];
  const checkLinkOptions = await optionsFromFlags();
  let exitCode = 0;

  const { alwaysExitZero, reportUnusedPatterns, verbose } = checkLinkOptions;

  if (verbose) console.log("Options:", checkLinkOptions);

  function conclude() {
    console.log(outputSegments.join("\n\n"));
    process.exit(alwaysExitZero ? 0 : exitCode);
  }

  const fileEntries = await getContentEntries(checkLinkOptions);

  const {
    totalChecks,
    failedChecks,
    entries,
    unusedPatterns,
  } = await checkFileEntries(fileEntries, checkLinkOptions);

  if (totalChecks === 0) {
    outputSegments.push("There were no links to check!");
  } else {
    const reportBody = formatEntries(entries);

    if (reportUnusedPatterns) {
      if (unusedPatterns.length > 0) {
        outputSegments.push(
          `Some link ignore patterns were unused!\n\n${unusedPatterns.join(
            "\n"
          )}\n`
        );
      } else {
        outputSegments.push("All link patterns were used.");
      }
      if (reportUnusedPatterns === "only") {
        conclude();
      }
    }

    if (failedChecks > 0) {
      outputSegments.push(`${reportBody}\n\n${failedChecks} links failed.`);
      if (!alwaysExitZero) exitCode = 2;
    } else {
      outputSegments.push(`${reportBody}\n\nAll links passed!`);
    }
  }

  conclude();
}

main();
