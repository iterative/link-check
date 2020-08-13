import checkLink, { CheckLinkOptions, LinkCheck } from "./checkLink";
import scrapeLinks from "./scrapeLinks";

interface FileEntry {
  filePath: string;
}

interface FileLinksEntry extends FileEntry {
  links: string[];
}

interface StringFilter {
  (string): boolean;
}

export interface FileContentEntry extends FileEntry {
  content:
    | string
    | string[]
    | ((filePath?: string) => string | string[] | Promise<string | string[]>);
}

export interface FileChecksEntry extends FileEntry {
  checks: LinkCheck[];
}

export const asyncMap: <I, O>(
  cb: (item: I) => Promise<O>,
  collection: Array<I>
) => Promise<Array<O>> = async (cb, collection) =>
  Promise.all(collection.map(cb));

export interface CheckEntriesOptions {
  rootURL: string;
  linkFilter?: StringFilter;
}

export const checkFileEntries: (
  fileContentEntries: FileContentEntry[],
  options?: CheckEntriesOptions
) => Promise<FileChecksEntry[]> = async (fileContentEntries, options) =>
  (
    await asyncMap<FileContentEntry, FileChecksEntry>(
      (entry) => checkFileEntry(entry, options),
      fileContentEntries
    )
  ).filter(Boolean);

export const checkFileEntry: (
  entry: FileContentEntry,
  options: CheckEntriesOptions
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
      (link) => checkLink({ rootURL, linkFilter, link } as CheckLinkOptions),
      scrapeLinks(resolvedEntry)
    )
  ).filter(Boolean);
  return {
    filePath,
    checks,
  };
};
