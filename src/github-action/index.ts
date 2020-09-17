// eslint-disable-next-line import/no-extraneous-dependencies
import * as core from "@actions/core";
import { exec } from "child_process";
import getContentEntries from "../inputs";
import { checkFileEntries } from "../checkFileEntries";
import useOutputs from "../outputs/useOutputs";
import * as consoleLogOutput from "../outputs/consoleLog";
import * as checksActionOutput from "../outputs/checksAction";
import exitWithCode from "../exitWithCode";

import { parseFile, mergeAndResolveOptions } from "../getOptions";
import { UnresolvedLinkCheckOptions } from "../types";

const availableOutputs = [checksActionOutput, consoleLogOutput];

function getInput(inputName: string): string | string[] {
  const input = core.getInput(inputName);
  try {
    return JSON.parse(input);
  } catch (e) {
    if (e instanceof SyntaxError) {
      return input;
    }
    throw e;
  }
}

function parseStringValue(value) {
  switch (value) {
    case "":
      return undefined;
    case "false":
      return false;
    default:
      return value;
  }
}

async function optionsFromCoreInputs() {
  const {
    configFile,
    output = "consoleLog",
    failsOnly = true,
    verbose = false,
    ...inputOptions
  }: UnresolvedLinkCheckOptions & {
    configFile?: string;
  } = [
    "source",
    "configFile",
    "rootURL",
    "dryRun",
    "unusedPatternsOnly",
    "diff",

    "linkIncludePatternFile",
    "linkIncludePatterns",
    "linkExcludePatternFile",
    "linkExcludePatterns",

    "fileIncludePatternFile",
    "fileIncludePatterns",
    "fileExcludePatternFile",
    "fileExcludePatterns",
    "output",
    "failsOnly",
    "verbose",
  ].reduce((acc, name) => {
    const value = parseStringValue(getInput(name));
    return value === undefined ? acc : { ...acc, [name]: value };
  }, {}) as UnresolvedLinkCheckOptions;

  return mergeAndResolveOptions([
    {
      ...inputOptions,
      output: typeof output === "string" ? [output] : output,
      failsOnly,
      verbose,
    },
    await parseFile(configFile),
  ]);
}

async function main() {
  const gitFetchPromise = new Promise((resolve, reject) => {
    exec("git fetch origin master", (err) => (err ? reject(err) : resolve()));
  });

  const options = await optionsFromCoreInputs();

  if (options.verbose) console.log("Options:", options);

  await gitFetchPromise;

  const fileEntries = await getContentEntries(options);
  const report = await checkFileEntries(fileEntries, options);
  useOutputs(availableOutputs, options, report);
  if (!options.output.includes("checksAction")) {
    exitWithCode(report, options);
  } else {
    process.exit(0);
  }
}
main();
