import defaults from "lodash/defaults";
import path from "path";
import yaml from "js-yaml";
import { UnresolvedLinkCheckOptions, LinkCheckOptions } from "./types";
import { transformFileContents, asyncMap } from "./util";

type FilePatternsEntry = [
  string | string[] | undefined,
  string | string[] | undefined
];

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

export async function parseFile<T = Partial<UnresolvedLinkCheckOptions>>(
  filePath?: string
): Promise<T | null> {
  if (!filePath) return null;

  const extension = path.extname(filePath);
  switch (extension) {
    case ".yml":
    case ".yaml":
      return transformFileContents<T>(
        filePath,
        (data) => (yaml.safeLoad(String(data)) as unknown) as T
      );
    case ".json":
      return transformFileContents<T>(filePath, (data: Buffer) =>
        JSON.parse(String(data))
      );
    default:
      throw new Error(
        `Options file "${filePath}" has unrecognized extension "${extension}"`
      );
  }
}

async function readFileArray(filePath: string): Promise<string[]> {
  const lines = await parseFile<string[]>(filePath);
  if (!Array.isArray(lines)) {
    throw new Error(
      `File "${filePath}" is expected to be an Array, but was a ${typeof lines}!`
    );
  }
  return lines;
}

async function combineFileArrays(
  filePaths: string[] | string | undefined
): Promise<string[]> {
  if (!filePaths) return [];
  return Array.isArray(filePaths)
    ? ([] as string[]).concat(
        ...(await asyncMap<string, string[]>(filePaths, readFileArray))
      )
    : readFileArray(filePaths);
}

export default async function patternsFromFiles(
  entries: FilePatternsEntry[]
): Promise<string[][]> {
  return asyncMap<FilePatternsEntry, string[]>(
    entries,
    async ([filenames, patterns]) => {
      const filePatterns = await combineFileArrays(filenames);
      return (patterns ? filePatterns.concat(patterns) : filePatterns).filter(
        Boolean
      );
    }
  );
}

export async function mergeAndResolveOptions(
  configs: Array<UnresolvedLinkCheckOptions>
): Promise<LinkCheckOptions> {
  const mergedOptions: UnresolvedLinkCheckOptions = defaults(
    {},
    ...configs.filter(Boolean)
  );
  const {
    diff = false,
    fileIncludePatterns,
    fileExcludePatterns,
    fileIncludePatternFile,
    fileExcludePatternFile,
    linkIncludePatterns,
    linkExcludePatterns,
    linkIncludePatternFile,
    linkExcludePatternFile,
    unusedPatternsOnly,
    dryRun = unusedPatternsOnly,
    failOnUnusedPatterns = unusedPatternsOnly,
    linkOptions = {},
    output,
    ...rest
  } = mergedOptions;

  const [
    resolvedLinkIncludePatterns,
    resolvedLinkExcludePatterns,
    resolvedFileIncludePatterns,
    resolvedFileExcludePatterns,
  ] = await patternsFromFiles([
    [linkIncludePatternFile, linkIncludePatterns],
    [linkExcludePatternFile, linkExcludePatterns],
    [fileIncludePatternFile, fileIncludePatterns],
    [fileExcludePatternFile, fileExcludePatterns],
  ]);

  return ({
    ...rest,
    diff,
    linkOptions,
    unusedPatternsOnly,
    dryRun,
    output: output && (Array.isArray(output) ? output : [output]),
    failOnUnusedPatterns,
    linkIncludePatterns: patternsOrGlobstar(resolvedLinkIncludePatterns),
    linkExcludePatterns: resolvedLinkExcludePatterns,
    fileIncludePatterns: patternsOrGlobstar(resolvedFileIncludePatterns),
    fileExcludePatterns: resolvedFileExcludePatterns,
  } as unknown) as LinkCheckOptions;
}
