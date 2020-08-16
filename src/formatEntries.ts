import { LinkCheck, FileChecksEntry } from "./types";

interface FormatterOptions {
  entryFormat?: (
    entry: FileChecksEntry,
    options?: FormatterOptions,
    index?: number
  ) => string;
  entrySeparator?: string;
  fileFormat?: (fileEntry: FileChecksEntry) => string;
  linkFormat?: (check: LinkCheck) => string;
  linkSeparator?: string;
}

const defaultFileFormat = ({ checks, filePath }) =>
  `* ${checks.some((check) => !check.pass) ? "FAIL" : "PASS"}: ${filePath}\n`;

const defaultLinkFormat = ({ link, href, description, pass }: LinkCheck) =>
  `  - ${pass ? "PASS" : "FAIL"}: ${link}${
    href ? ` = ${href}` : ""
  } (${description})`;

const defaultEntryFormat = (
  { filePath, checks },
  {
    fileFormat = defaultFileFormat,
    linkFormat = defaultLinkFormat,
    linkSeparator = "\n",
  }
) =>
  checks.length > 0
    ? fileFormat({ filePath, checks }) +
      checks
        .sort((a, b) => {
          if (a.pass === b.pass) return 0;
          return a.pass ? 1 : -1;
        })
        .map(linkFormat)
        .join(linkSeparator)
    : null;

const formatFileEntries: (
  fileCheckEntries: FileChecksEntry[],
  options?: FormatterOptions
) => string = (fileCheckEntries, options = {}) => {
  const { entryFormat = defaultEntryFormat, entrySeparator = "\n\n" } = options;
  return fileCheckEntries
    .map((entry, i) => entryFormat(entry, options, i))
    .filter(Boolean)
    .join(entrySeparator);
};

export default formatFileEntries;
