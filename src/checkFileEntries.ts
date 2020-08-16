import checkLink from "./checkLink";
import scrapeLinks from "./scrapeLinks";
import asyncMap from "./async-map";

import {
  FileContentEntry,
  FileChecksEntry,
  LinkCheck,
  CheckLinkOptions,
  CheckLinkArgs,
} from "./types";

const getURL = (link: string, rootURL: string | URL) => {
  return new URL(
    /^(https?:\/)?\//.test(link) ? link : `https://${link}`,
    rootURL
  );
};

export const checkFileEntry: (
  entry: FileContentEntry,
  options: CheckLinkOptions
) => Promise<FileChecksEntry> = async (
  { filePath, content },
  { rootURL, linkFilter }
) => {
  const resolvedEntry = {
    filePath,
    content: await (typeof content === "function"
      ? content(filePath)
      : content),
  };
  const checks = (
    await asyncMap<string, LinkCheck>(
      scrapeLinks(resolvedEntry),
      async (link: string) => {
        const url = getURL(link, rootURL);
        const check = await checkLink({
          link,
          url,
          linkFilter,
        } as CheckLinkArgs);
        return check;
      }
    )
  ).filter(Boolean);
  return {
    filePath,
    checks,
  };
};

export const checkFileEntries: (
  fileContentEntries: FileContentEntry[],
  options?: CheckLinkOptions
) => Promise<FileChecksEntry[]> = async (fileContentEntries, options) =>
  (
    await asyncMap<FileContentEntry, FileChecksEntry>(
      fileContentEntries,
      (entry: FileContentEntry) => checkFileEntry(entry, options)
    )
  ).filter(Boolean);
