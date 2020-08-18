import scrapeLinks from "./scrapeLinks";

const testMarkdownString = `
This is a Markdown example with [a link to google](https://www.google.com) and [one with a subdirectory](https://www.google.com/nested/page.html)

and [another to reddit](www.reddit.com) and [a third to Twitter](facebook.com)

as well as some blank lines
`;

const plaintextString = `
This string is plaintext, with links like https://www.google.com and https://www.google.com/nested/page.html

I can scrape "https://reddit.com/r/subreddit" and (https://facebook.com) as well!

The new regex can pull www.youtube.com too!? unfortunately, gmail.com is just too vague.
`;

const plaintextTestResult = [
  "https://www.google.com",
  "https://www.google.com/nested/page.html",
  "https://reddit.com/r/subreddit",
  "https://facebook.com",
  "www.youtube.com",
];

const markdownTestResult = [
  "https://www.google.com",
  "https://www.google.com/nested/page.html",
  "www.reddit.com",
  "facebook.com",
];

test("It scrapes from the markdown test string", () => {
  expect(
    scrapeLinks({
      filePath: "test.md",
      content: testMarkdownString,
    })
  ).toEqual(markdownTestResult);
});

test("It scrapes from the markdown test split by newlines", () => {
  const splitTest = testMarkdownString.split("\n");
  expect(
    scrapeLinks({
      filePath: "test.md",
      content: splitTest,
    })
  ).toEqual(markdownTestResult);
});

test("It scrapes absolute links from unrecognized extensions", () => {
  expect(
    scrapeLinks({
      filePath: "test",
      content: plaintextString,
    })
  ).toEqual(plaintextTestResult);
});
