import { Command } from "commander";
import { checkFileEntries } from "./checkFileEntries";
import { parseFile, mergeAndResolveOptions } from "./getOptions";
import { LinkCheckOptions } from "./types";
import getContentEntries from "./inputs/index";
import { reporter } from "./outputs/consoleLog";
import exitWithCode from "./exitWithCode";

function commaSeparatedList(current: string) {
  return current.split(",");
}

function collect(current, acc) {
  return acc ? [...acc, current] : [current];
}

const optionsFromFlags: () => Promise<LinkCheckOptions> = async () => {
  const program = new Command();

  program
    .name("repo-link-check")
    .usage("[options]")
    .option("-c, --configFile <path>", "Path to the configuration file")
    .option(
      "-r, --rootURL <url>",
      "Check root-relative links relative to this URL"
    )
    .option(
      "-o, --output <strategy[,strategy]>",
      "Use one or more strategies to generate report output",
      commaSeparatedList
    )
    .option(
      "-d, --diff",
      "Use git diff from origin/master as a source instead of the whole filesystem."
    )
    .option("--dryRun", "Skip checking parsed links and report them as skipped")
    .option(
      "-u, --unusedPatternsOnly",
      "Do a dry run and exit after printing unused patterns"
    )
    .option("-f, --failsOnly", "Only report failing links")
    .option("-v, --verbose", "Log fully resolved options")
    .option(
      "-li, --linkIncludePatterns <pattern>",
      "Add a micromatch pattern used to whitelist links",
      collect
    )
    .option(
      "-le, --linkExcludePatterns <pattern>",
      "Add a micromatch pattern used to exclude links",
      collect
    )
    .option(
      "-fi, --fileIncludePatterns <pattern>",
      "Add a micromatch pattern used to whitelist files to scrape links from",
      collect
    )
    .option(
      "-fe, --fileExcludePatterns <pattern>",
      "Add a micromatch pattern used to exclude files to scrape links from",
      collect
    )
    .on("--help", () => {
      console.log(
        "\nTo specify multiple patterns, use the relevant flag multiple times."
      );
    })
    .parse(process.argv);

  const {
    configFile,
    diff,
    rootURL,
    fileIncludePatterns,
    fileExcludePatterns,
    linkIncludePatterns,
    linkExcludePatterns,
    unusedPatternsOnly,
    dryRun = unusedPatternsOnly,
    failsOnly,
    verbose,
  } = program;

  const argsOptions = {
    diff,
    rootURL,
    fileIncludePatterns,
    fileExcludePatterns,
    linkIncludePatterns,
    linkExcludePatterns,
    unusedPatternsOnly,
    verbose,
    dryRun,
    failsOnly,
  };

  const fileOptions = await parseFile(configFile);

  return mergeAndResolveOptions([argsOptions, fileOptions]);
};

async function main() {
  const options = await optionsFromFlags();
  if (options.verbose) console.log("Options:", options);
  const fileEntries = await getContentEntries(options);
  const report = await checkFileEntries(fileEntries, options);
  reporter(report, options);
  exitWithCode(report, options);
}

main();
