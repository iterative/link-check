import { exec } from "child_process";
import mm from "micromatch";
import { FileContentEntry, LinkCheckOptions } from "../types";

const shellPromise = (command: string): Promise<string> =>
  new Promise((resolve, reject) =>
    exec(command, (error, stdout, stderr) =>
      error
        ? reject(
            new Error(
              JSON.stringify({
                error,
                stdout,
                stderr,
              })
            )
          )
        : resolve(stdout)
    )
  );

const getGitDiffPatchText: () => Promise<string> = async (
  ancestor = "origin/master"
) => {
  try {
    return shellPromise(`git diff -U0 --minimal ${ancestor}...HEAD`);
  } catch (e) {
    throw new Error(
      `There was an error trying to get a diff between ${ancestor} and HEAD! (${e})`
    );
  }
};

const setGitOrigin: (origin: string) => Promise<void> = async (origin) => {
  try {
    await shellPromise("git remote remove origin");
    await shellPromise(`git remote add origin ${origin}`);
  } catch (e) {
    throw new Error(`There was an error switching origin to ${origin}!`);
  }
};

const getFileContentEntries: (
  options: LinkCheckOptions
) => Promise<FileContentEntry[]> = async ({
  fileIncludePatterns,
  fileExcludePatterns,
  origin,
}) => {
  if (origin) {
    await setGitOrigin(origin);
  }
  const splitPatchText = (await getGitDiffPatchText()).split(
    /^diff --git.* b\/(.*)\n(?:.*\n){4}/gm
  );

  const processedOutputs: FileContentEntry[] = [];
  for (let i = 1; i < splitPatchText.length; i += 2) {
    const filePath = splitPatchText[i];
    if (
      mm.isMatch(filePath, fileIncludePatterns, { ignore: fileExcludePatterns })
    ) {
      const content = splitPatchText[i + 1]
        .split("\n")
        .filter((line) => line.startsWith("+"))
        .map((line) => line.slice(1))
        .join("\n");

      if (content.length > 0) {
        processedOutputs.push({
          filePath,
          content,
        });
      }
    }
  }

  return processedOutputs;
};

export default getFileContentEntries;
