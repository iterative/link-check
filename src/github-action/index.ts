// eslint-disable-next-line import/no-extraneous-dependencies
import * as core from "@actions/core";
import { exec } from "child_process";
import getContentEntries from "../inputs";
import { checkFileEntries } from "../checkFileEntries";
import useOutputs from "../outputs/useOutputs";
import consoleLogOutput from "../outputs/consoleLog";
import exitCodeOutput from "../outputs/exitCode";
import checkActionOutput from "../outputs/checkAction";

import { optionsFromFile, mergeAndResolveOptions } from "../getOptions";
import { UnresolvedLinkCheckOptions } from "../types";

const availableOutputs = [checkActionOutput, consoleLogOutput, exitCodeOutput];

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

async function optionsFromCoreInputs() {
  const {
    configFile,
    output = ["consoleLog", "exitCode"],
    failsOnly,
    ...inputOptions
  }: UnresolvedLinkCheckOptions & {
    configFile?: string;
  } = Object.fromEntries(
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
      "output",
      "failsOnly",
    ].reduce((acc, name) => {
      const value = getInput(name);
      return value === "" ? acc : [...acc, [name, value]];
    }, [])
  ) as UnresolvedLinkCheckOptions;

  return mergeAndResolveOptions([
    {
      ...inputOptions,
      output,
      failsOnly: failsOnly !== "false",
    },
    await optionsFromFile(configFile),
  ]);
}

async function main() {
  const gitFetchPromise = new Promise((resolve, reject) => {
    exec("git fetch origin master", (err) => (err ? reject(err) : resolve()));
  });

  const options = await optionsFromCoreInputs();

  console.log("Options:", options);

  await gitFetchPromise;

  const fileEntries = await getContentEntries(options);
  const report = await checkFileEntries(fileEntries, options);
  useOutputs(availableOutputs, options, report);
}
main();
