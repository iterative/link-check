import fs from "fs";
import { asyncMap } from "./util";

export const patternsOrGlobstar = (
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
