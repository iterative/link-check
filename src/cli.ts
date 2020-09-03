import minimist from "minimist";
import { checkFileEntries } from "./checkFileEntries";
import { optionsFromFile, mergeAndResolveOptions } from "./getOptions";
import { LinkCheckOptions } from "./types";
import getContentEntries from "./inputs/index";
import useOutputs from "./outputs/useOutputs";
import consoleOutput from "./outputs/consoleLog";
import exitCodeOutput from "./outputs/exitCode";

const availableOutputs = [consoleOutput, exitCodeOutput];

const optionsFromFlags: () => Promise<LinkCheckOptions> = async () => {
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
    "report-unused-patterns": reportUnusedPatterns,
    "dry-run": dryRun = reportUnusedPatterns === "only",
    "fails-only": failsOnly = false,
    verbose,
    output = ["consoleLog"],
  } = minimist(process.argv.slice(2), {
    alias: {
      c: "config",
      s: "source",
      u: "report-unused-patterns",
      r: "rootURL",
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
      o: "output",
      f: "fails-only",
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
    reportUnusedPatterns,
    verbose,
    dryRun,
    output,
    failsOnly,
  };

  const fileOptions = await optionsFromFile(config);

  return mergeAndResolveOptions([argsOptions, fileOptions]);
};

async function main() {
  const options = await optionsFromFlags();
  if (options.verbose) console.log("Options:", options);
  const fileEntries = await getContentEntries(options);
  const report = await checkFileEntries(fileEntries, options);
  useOutputs(availableOutputs, options, report);
}

main();
