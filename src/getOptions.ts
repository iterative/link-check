import defaults from "lodash/defaults";
import fs from "fs";
import path from "path";
import { UnresolvedLinkCheckOptions, LinkCheckOptions } from "./types";
import asyncMap from "./async-map";

const patternsOrGlobstar = (
  patterns: string | string[] | undefined
): string | string[] => {
  if (patterns) {
    if (Array.isArray(patterns)) {
      if (patterns.length > 0) return patterns;
    } else {
      return patterns;
    }
  }
  return "**";
};

async function getSingleFileLines(filePath: string): Promise<string[]> {
  return new Promise((resolve, reject) =>
    fs.readFile(filePath, (err, buffer) => {
      if (err) return reject(err);
      return resolve(String(buffer).split(/\n+/));
    })
  );
}

async function getFileLines(
  filePaths: string[] | string | undefined
): Promise<string[]> {
  if (!filePaths) return [];
  return Array.isArray(filePaths)
    ? ([] as string[]).concat(
        ...(await asyncMap<string, string[]>(filePaths, getSingleFileLines))
      )
    : getSingleFileLines(filePaths);
}

type FilePatternsEntry = [
  string | string[] | undefined,
  string | string[] | undefined
];

export default async function patternsFromFiles(
  entries: FilePatternsEntry[]
): Promise<string[][]> {
  return asyncMap<FilePatternsEntry, string[]>(
    entries,
    async ([filenames, patterns]) => {
      const filePatterns = await getFileLines(filenames);
      return (patterns ? filePatterns.concat(patterns) : filePatterns).filter(
        Boolean
      );
    }
  );
}

export const optionsFromFile: (
  filePath: string | undefined
) => Promise<UnresolvedLinkCheckOptions> = async (filePath) => {
  if (!filePath) return {};
  const fileOptions = JSON.parse(
    String(fs.readFileSync(path.join(process.cwd(), filePath)))
  );
  return fileOptions;
};

export async function mergeAndResolveOptions(
  configs: Array<UnresolvedLinkCheckOptions>
): Promise<LinkCheckOptions> {
  const mergedOptions: UnresolvedLinkCheckOptions = defaults(
    {},
    ...configs.filter(Boolean)
  );
  const {
    fileIncludePatterns,
    fileExcludePatterns,
    fileIncludePatternFiles,
    fileExcludePatternFiles,
    linkIncludePatterns,
    linkExcludePatterns,
    linkIncludePatternFiles,
    linkExcludePatternFiles,
    reportUnusedPatterns,
    dryRun = reportUnusedPatterns === "only",
    failOnUnusedPatterns = reportUnusedPatterns === "only",
    bottlenecks = {},
    output,
    ...rest
  } = mergedOptions;

  const [
    resolvedLinkIncludePatterns,
    resolvedLinkExcludePatterns,
    resolvedFileIncludePatterns,
    resolvedFileExcludePatterns,
  ] = await patternsFromFiles([
    [linkIncludePatternFiles, linkIncludePatterns],
    [linkExcludePatternFiles, linkExcludePatterns],
    [fileIncludePatternFiles, fileIncludePatterns],
    [fileExcludePatternFiles, fileExcludePatterns],
  ]);

  return ({
    ...rest,
    bottlenecks,
    reportUnusedPatterns,
    dryRun,
    output: output && (Array.isArray(output) ? output : [output]),
    failOnUnusedPatterns,
    linkIncludePatterns: patternsOrGlobstar(resolvedLinkIncludePatterns),
    linkExcludePatterns: resolvedLinkExcludePatterns,
    fileIncludePatterns: patternsOrGlobstar(resolvedFileIncludePatterns),
    fileExcludePatterns: resolvedFileExcludePatterns,
  } as unknown) as LinkCheckOptions;
}
