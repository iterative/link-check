import { LinkCheckOptions, FileContentEntry } from "../types";
import contentFromGitDiff from "./git-diff";
import contentFromFilesystem from "./filesystem";

async function getContentEntries(
  options: LinkCheckOptions
): Promise<FileContentEntry[]> {
  const { source } = options;
  switch (source) {
    case undefined:
    case "git-diff": {
      return contentFromGitDiff(options);
    }
    case "filesystem": {
      return contentFromFilesystem(options);
    }
    default:
      throw new Error(`link-check was provided unexpected source "${source}"!`);
  }
}

export default getContentEntries;
