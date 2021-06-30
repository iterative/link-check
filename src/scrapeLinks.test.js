import scrapeLinks from "./scrapeLinks";

const markdownString = `
Markdown sample with a [link to Google](https://www.google.com), one [with a URL path](https://www.google.com/nested/page.html), and others:

- One [to reddit](www.reddit.com)
- A fourth [to Facebook](facebook.com) (incomplete URLs)
- Finally a few [ref] [links][links] [here][link-here]
- BTW it shouldn't plain links like http://www.this.com or that.com shouldn't get picked up.

[ref]: https://www.ref.com
[links]:
  www.links.in/newline
[link-here]:
  /just/a/path

There's also some blank lines, misc. text, and <span>HTML</span> code.
`;

const plaintextString = `
This string is plaintext, with links like https://www.google.com and https://www.google.com/nested/page.html

I can scrape "https://reddit.com/r/subreddit" and (https://facebook.com) as well! The new regex can pull www.youtube.com too!?

TODO: Unfortunately, gmail.com is just too vague.
TODO: Ending in a period won't work well either, e.g. www.something.com.
`;

const markdownTestResult = [
  "https://www.google.com",
  "https://www.google.com/nested/page.html",
  "www.reddit.com",
  "facebook.com",
  "https://www.ref.com",
  "www.links.in/newline",
  "/just/a/path",
];

const plaintextTestResult = [
  "https://www.google.com",
  "https://www.google.com/nested/page.html",
  "https://reddit.com/r/subreddit",
  "https://facebook.com",
  "www.youtube.com",
  "www.something.com.",
];

test("It scrapes from the markdown test string", () => {
  expect(
    scrapeLinks({
      filePath: "test.md",
      content: markdownString,
    })
  ).toEqual(markdownTestResult);
});

test("It scrapes from the markdown test split by newlines", () => {
  const splitTest = markdownString.split("\n");
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
