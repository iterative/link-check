import { LinkCheck } from "./checkLink";
import { FileChecksEntry } from "./checkFileEntries";

interface FormatterOptions {
  entryFormat?: (
    entry: FileChecksEntry,
    options?: FormatterOptions,
    index?: number
  ) => string;
  entrySeparator?: string;
  fileFormat?: (FileChecksEntry) => string;
  linkFormat?: (LinkCheck) => string;
  linkSeparator?: string;
}

const formatFileEntries: (
  fileCheckEntries: FileChecksEntry[],
  options?: FormatterOptions
) => string = (fileCheckEntries, options = {}) => {
  const {
    entryFormat = (
      { filePath, checks },
      {
        fileFormat = ({ checks, filePath }) =>
          `* ${
            checks.some((check) => !check.pass) ? "FAIL" : "PASS"
          }: ${filePath}\n`,
        linkFormat = ({ link, href, description, pass }: LinkCheck) =>
          `  - ${pass ? "PASS" : "FAIL"}: ${link}${
            href ? ` = ${href}` : ""
          } (${description})`,
        linkSeparator = "\n",
      }
    ) =>
      checks.length > 0
        ? fileFormat({ filePath, checks }) +
          checks
            .sort((a, b) => (a.pass === b.pass ? 0 : a.pass ? 1 : -1))
            .map(linkFormat)
            .join(linkSeparator)
        : null,
    entrySeparator = "\n\n",
  } = options;
  return fileCheckEntries
    .map((entry, i) => entryFormat(entry, options, i))
    .filter(Boolean)
    .join(entrySeparator);
};

export default formatFileEntries;
