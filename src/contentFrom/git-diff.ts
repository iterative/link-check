import { exec } from "child_process";
import mm from "micromatch";
import { FileContentEntry, CheckLinkOptions } from "../types";

const getGitDiffPatchText: () => Promise<string> = async () =>
  new Promise((resolve, reject) => {
    exec("git diff -U0 --minimal origin/master", (err, stdout) =>
      err ? reject(err) : resolve(stdout)
    );
  });

const getFileContentEntries: (
  options: CheckLinkOptions
) => Promise<FileContentEntry[]> = async ({
  fileIncludePatterns,
  fileExcludePatterns,
}) => {
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
