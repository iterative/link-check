import checkLink from "./checkLink";
import scrapeLinks from "./scrapeLinks";
import asyncMap from "./async-map";

import {
  FileContentEntry,
  FileChecksEntry,
  LinkCheck,
  CheckLinkOptions,
} from "./types";

const getURL = (link: string, rootURL: string | URL) => {
  try {
    return new URL(
      /^(https?:\/)?\//.test(link) ? link : `https://${link}`,
      rootURL
    );
  } catch (e) {
    return null;
  }
};

export const checkFileEntry: (
  entry: FileContentEntry,
  options: CheckLinkOptions
) => Promise<FileChecksEntry> = async ({ filePath, content }, options) => {
  const { rootURL } = options;
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
        if (!url) return null;
        const check = await checkLink(
          {
            link,
            url,
          },
          options
        );
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
) => Promise<FileChecksEntry[]> = async (fileContentEntries, options) => {
  return (
    await asyncMap<FileContentEntry, FileChecksEntry>(
      fileContentEntries,
      (entry: FileContentEntry) => checkFileEntry(entry, options)
    )
  ).filter((file) => file.checks.length > 0);
};
