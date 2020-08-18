import scrapeLinks from "./scrapeLinks";

const testMarkdownString = `
This is a Markdown example with [a link to google](https://www.google.com) and [one with a subdirectory](https://www.google.com/nested/page.html)

and [another to reddit](www.reddit.com) and [a third to Twitter](facebook.com)

as well as some blank lines
`;

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
      content: testMarkdownString,
    })
  ).toEqual([
    "https://www.google.com",
    "https://www.google.com/nested/page.html",
  ]);
});
