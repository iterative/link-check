import { CheckedLink, FileChecksEntry } from "./types";

interface EntryFormatter {
  (entry: FileChecksEntry, options?: FormatterOptions, index?: number): string;
}

interface FileFormatter {
  (fileEntry: FileChecksEntry): string;
}

interface LinkFormatter {
  (check: CheckedLink): string;
}

interface DefaultEntryFormatterOptions {
  fileFormat?: FileFormatter;
  linkFormat?: LinkFormatter;
  entrySeparator?: string;
  linkSeparator?: string;
}

interface FormatterOptions extends DefaultEntryFormatterOptions {
  entryFormat?: EntryFormatter;
  failsOnly?: boolean;
}

const defaultFileFormat = ({ filePath }) => `* ${filePath}\n`;

const defaultLinkFormat = ({ link, href, description, pass }: CheckedLink) =>
  `  - ${pass ? "PASS" : "FAIL"}: ${link}${
    href ? ` = ${href}` : ""
  } (${description})`;

const defaultEntryFormat: EntryFormatter = (
  { filePath, checks },
  {
    fileFormat = defaultFileFormat,
    linkFormat = defaultLinkFormat,
    linkSeparator = "\n",
  }
) =>
  checks.length > 0
    ? fileFormat({ filePath, checks }) +
      checks.map(linkFormat).join(linkSeparator)
    : null;

// An alternate default formatter for failsOnly, where showing "FAIL" is redundant
const noResultEntryFormat: EntryFormatter = (args, options) =>
  defaultEntryFormat(args, {
    linkFormat: ({ link, href, description }) =>
      `  - ${link}${href ? ` = ${href}` : ""} (${description})`,
    fileFormat: ({ filePath }) => `* ${filePath}\n`,
    ...options,
  });

const formatFileEntries: (
  fileCheckEntries: FileChecksEntry[],
  options?: FormatterOptions
) => string = (fileCheckEntries, options = {}) => {
  const {
    entryFormat = options.failsOnly ? noResultEntryFormat : defaultEntryFormat,
    entrySeparator = "\n\n",
  } = options;
  return fileCheckEntries
    .map((entry, i) => entryFormat(entry, options, i))
    .filter(Boolean)
    .join(entrySeparator);
};

export default formatFileEntries;
