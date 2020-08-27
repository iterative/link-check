import path from "path";

const regexMap = (
  input: string,
  regex: RegExp,
  iteratee = (x: string[]) => x[1]
): string[] => {
  const results = [];
  let match: string[] = regex.exec(input);
  while (match !== null) {
    const result = iteratee(match);
    if (result) results.push(result);
    match = regex.exec(input);
  }
  return results;
};

const scrapeFromString: (filePath: string, content: string) => string[] = (
  filePath,
  content
) => {
  switch (path.extname(filePath)) {
    case ".md":
    case ".mdx": {
      const links = regexMap(
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
      return regexMap(content, /href="(.*?)"/gm);
    case ".json":
      return regexMap(content, /"(?:(?:https?:)?\/\/)?(?:)"/gm);
    default:
      // credit to https://urlregex.com/, but modified to only hit http/s protocol
      return regexMap(
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
