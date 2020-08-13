import path from "path";

const matchAllPluck = (input, regex, pluck = (x) => x[1]) =>
  Array.from(input.matchAll(regex), pluck);

const scrapeFromString: (
  filePath: string,
  content: string | string[]
) => string[] = (filePath, content) => {
  switch (path.extname(filePath)) {
    case ".md":
    case ".mdx":
      return matchAllPluck(
        content,
        /\[.*?\]\((?:<((?:\(.*?\)|.)*?)>|((?:\(.*?\)|.)*?))(?: ["'].*?["'])?\)/gm,
        (x) => x[2] || x[1]
      );
    case ".html":
      return matchAllPluck(content, /href="(.*?)"/gm);
    case ".json":
      return matchAllPluck(content, /"(?:(?:https?:)?\/\/)?(?:)"/gm);
    default:
      return [];
  }
};

const defaultScrapeLinks: (args: {
  filePath: string;
  content: string | string[];
}) => string[] = ({ filePath, content }) =>
  (Array.isArray(content)
    ? [].concat(...content.map((line) => scrapeFromString(filePath, line)))
    : scrapeFromString(filePath, content)
  ).filter((link) => link && !link.startsWith("#"));

export default defaultScrapeLinks;
