import checkLink, { getUnusedLinkExcludePatterns } from "./checkLink";
import scrapeLinks from "./scrapeLinks";
import asyncMap from "./async-map";

import {
  FileContentEntry,
  FileChecksEntry,
  CheckedLink,
  LinkCheckOptions,
  ChecksReport,
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
  options: LinkCheckOptions
) => Promise<FileChecksEntry> = async ({ filePath, content }, options) => {
  const { rootURL } = options;
  const resolvedEntry = {
    filePath,
    content: await (typeof content === "function"
      ? content(filePath)
      : content),
  };
  const checks = (
    await asyncMap<string, CheckedLink>(
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

export async function checkFileEntries(
  fileContentEntries: FileContentEntry[],
  options?: LinkCheckOptions
): Promise<ChecksReport> {
  const entries = await asyncMap<FileContentEntry, FileChecksEntry>(
    fileContentEntries,
    (entry: FileContentEntry) => checkFileEntry(entry, options)
  );

  // Collect total count, failed count, and filtered failed entries in one pass of the dataset
  const [totalChecksCount, failedChecksCount, failedEntries] = entries.reduce(
    (
      [totalChecksCountAcc, totalFailedChecksCountAcc, failedEntriesAcc],
      { filePath, checks }
    ) => {
      const currentFailedChecks = checks.filter((check) => !check.pass);
      return [
        totalChecksCountAcc + checks.length,
        totalFailedChecksCountAcc + currentFailedChecks.length,
        currentFailedChecks.length > 0
          ? [
              ...failedEntriesAcc,
              {
                filePath,
                checks: currentFailedChecks,
              },
            ]
          : failedEntriesAcc,
      ];
    },
    [0, 0, []]
  );

  return {
    entries,
    failedEntries,
    totalChecksCount,
    failedChecksCount,
    unusedPatterns: getUnusedLinkExcludePatterns(options.linkExcludePatterns),
  } as ChecksReport;
}
