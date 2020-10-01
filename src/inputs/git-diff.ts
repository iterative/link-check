import { exec } from "child_process";
import mm from "micromatch";
import { FileContentEntry, LinkCheckOptions } from "../types";

const shellPromise = (command: string): Promise<string> =>
  new Promise((resolve, reject) =>
    exec(command, (err, stdout) => (err ? reject(err) : resolve(stdout)))
  );

const getGitDiffPatchText: () => Promise<string> = async () => {
  const mergeBase = (
    await shellPromise("git merge-base origin/master HEAD")
  ).trim();
  return shellPromise(`git diff -U0 --minimal ${mergeBase}`);
};

const setGitOrigin: (origin: string) => Promise<void> = async (origin) => {
  await shellPromise("git remote remove origin");
  await shellPromise(`git remote add origin ${origin}`);
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

  const processedOutputs = [];
  for (let i = 1; i < splitPatchText.length; i += 2) {
    const filePath = splitPatchText[i];
    if (
      mm.isMatch(filePath, fileIncludePatterns, { ignore: fileExcludePatterns })
    ) {
      const content = splitPatchText[i + 1]
        .split("\n")
        .filter((line) => line.startsWith("+"));

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
