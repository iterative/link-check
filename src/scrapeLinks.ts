import path from "path";

const matchAllPluck = (input: string, regex: RegExp, pluck = (x) => x[1]) =>
  Array.from(input.matchAll(regex), pluck);

const scrapeFromString: (filePath: string, content: string) => string[] = (
  filePath,
  content
) => {
  switch (path.extname(filePath)) {
    case ".md":
    case ".mdx": {
      const links = matchAllPluck(
        content,
        /\[.*?\]\((?:<((?:\(.*?\)|.)*?)>|((?:\(.*?\)|.)*?))(?: ["'].*?["'])?\)/gm,
        (x) => x[2] || x[1]
      );
      return links
        ? links
            .filter(Boolean)
            .map((link) => (link.startsWith("/static") ? link.slice(7) : link))
        : null;
    }
    case ".html":
      return matchAllPluck(content, /href="(.*?)"/gm);
    case ".json":
      return matchAllPluck(content, /"(?:(?:https?:)?\/\/)?(?:)"/gm);
    default:
      // credit to https://urlregex.com/, but modified to only hit http/s protocol
      return matchAllPluck(
        content,
        /(((https?:\/\/)[A-Za-z0-9.-]+|(?:www\.)[A-Za-z0-9.-]+)((?:\/[+~%/.\w\-_]*)?\??(?:[-+=&;%@.\w_]*)#?(?:[.!/\\\w]*))?)/gm,
        (x) => x[0]
      );
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
