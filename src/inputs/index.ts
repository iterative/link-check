import { LinkCheckOptions, FileContentEntry } from "../types";
import contentFromGitDiff from "./git-diff";
import contentFromFilesystem from "./filesystem";

async function getContentEntries(
  options: LinkCheckOptions
): Promise<FileContentEntry[]> {
  const { diff } = options;
  return diff ? contentFromGitDiff(options) : contentFromFilesystem(options);
}

export default getContentEntries;
