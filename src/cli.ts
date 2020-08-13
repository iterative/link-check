import minimist from "minimist";
import fs from "fs";
import contentFromGitDiff from "../contentFrom/git-diff";
import contentFromFilesystem from "../contentFrom/filesystem";
import { asyncMap } from "../checkFileEntries";
import formatEntries from "../formatEntries";
import { checkFileEntries } from "../checkFileEntries";
import buildFilter from "../buildFilter";

const patternsOrGlobstar = (patterns) => {
  if (patterns) {
    if (Array.isArray(patterns)) {
      if (patterns.length > 0) return patterns;
    } else {
      return patterns;
    }
  }
  return "**";
};

async function getContentEntries(options) {
  const { source }: { source: string } = options;
  switch (source) {
    case "git-diff": {
      return contentFromGitDiff();
    }
    case "filesystem": {
      return contentFromFilesystem(options);
    }
    default:
      throw new Error(`link-check was provided unexpected source "${source}"!`);
  }
}

async function getFileLines(filePath: string): Promise<string[]> {
  return new Promise((resolve, reject) =>
    fs.readFile(filePath, (err, buffer) => {
      if (err) return reject(err);
      return resolve(String(buffer).split(/\n+/));
    })
  );
}

async function getAllFileLines(
  filePaths: string[] | string | undefined
): Promise<string[]> {
  return Array.isArray(filePaths)
    ? ([] as string[]).concat(
        ...(await asyncMap<string, string[]>(getFileLines, filePaths))
      )
    : getFileLines(filePaths);
}

async function main() {
  const {
    source = "git-diff",
    rootURL,
    "file-include-pattern": argFileIncludePatterns,
    "file-exclude-pattern": argFileExcludePatterns,
    "file-include-file": fileIncludeFiles,
    "file-exclude-file": fileExcludeFiles,
    "link-include-pattern": argLinkIncludePatterns,
    "link-exclude-pattern": argLinkExcludePatterns,
    "link-include-file": linkIncludeFiles,
    "link-exclude-file": linkExcludeFiles,
  }: {
    source: "git-diff" | "filesystem";
    rootURL: string;
    "file-include-pattern": string | string[];
    "file-exclude-pattern": string | string[];
    "file-include-file": string | string[];
    "file-exclude-file": string | string[];
    "link-include-pattern": string | string[];
    "link-exclude-pattern": string | string[];
    "link-include-file": string | string[];
    "link-exclude-file": string | string[];
  } = minimist(process.argv.slice(2)) as any;

  const [
    linkIncludePatterns,
    linkExcludePatterns,
    fileIncludePatterns,
    fileExcludePatterns,
  ]: [string[], string[], string[], string[]] = await asyncMap<
    [string | string[] | undefined, string | string[] | undefined],
    string[]
  >(
    async ([filenames, patterns = []]) =>
      (
        await (filenames === undefined
          ? []
          : Array.isArray(filenames)
          ? getAllFileLines(filenames)
          : getFileLines(filenames))
      )
        .concat(patterns)
        .filter(Boolean),
    [
      [linkIncludeFiles, argLinkIncludePatterns],
      [linkExcludeFiles, argLinkExcludePatterns],
      [fileIncludeFiles, argFileIncludePatterns],
      [fileExcludeFiles, argFileExcludePatterns],
    ]
  );

  const options = {
    source,
    rootURL,
    linkFilter: buildFilter(
      patternsOrGlobstar(linkIncludePatterns),
      linkExcludePatterns
    ),
    fileIncludePatterns: patternsOrGlobstar(fileIncludePatterns),
    fileExcludePatterns,
  };

  const fileEntries = await getContentEntries(options);
  const checkedLinks = await checkFileEntries(fileEntries, options);
  const failCount = checkedLinks.reduce(
    (acc, { checks }) =>
      acc + checks.reduce((acc, check) => (check.pass ? acc : acc + 1), 0),
    0
  );
  console.log(
    formatEntries(checkedLinks) +
      "\n\n" +
      (failCount > 0 ? `${failCount} links failed.` : "All links passed!")
  );
  process.exit(0);
}

main();
