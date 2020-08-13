import { exec } from "child_process";
import * as core from "@actions/core";
import contentFromGitDiff from "../contentFrom/git-diff";
import { checkFileEntries } from "../checkFileEntries";
import formatEntries from "../formatEntries";
import buildFilter from "../buildFilter";

async function main() {
  console.log("Fetching origin/master");
  const gitFetchPromise = new Promise((resolve, reject) => {
    exec("git fetch origin master", (err) => (err ? reject(err) : resolve()));
  });

  const rootURL = core.getInput("rootURL", {});
  const exclusionFile = core.getInput("exclusionFile", {});
  const exclusionsFileString = core.getInput("exclusionsFile", {});

  await gitFetchPromise;

  const linkCheckOptions = {
    rootURL,
    fileFilter:
      exclusionFile &&
      buildFilter({
        patterns: exclusionFile,
      }),
    linkFilter:
      exclusionFile &&
      buildFilter({
        patterns: exclusionFile,
        readFile: true,
        inverse: true,
      }),
  };

  const fileEntries = await contentFromGitDiff();
  const checks = await checkFileEntries(fileEntries, linkCheckOptions);

  const report = formatEntries(checks, {
    linkFormat: ({ link, href, result, ok }) =>
      `  - ${ok ? ":heavy_check_mark:" : ":x:"} ${link}${
        href && href !== link ? ` = ${href}` : ""
      } (${result})`,
  });

  const text_description = `# Link check report:\n\n${report}`;
  const hasError = checks.some(({ checks }) =>
    checks.some(({ pass }) => !pass)
  );
  if (hasError) {
    core.setOutput(
      "output",
      JSON.stringify({
        summary: "Some new links failed the check.",
        text_description,
      })
    );
    core.setOutput("conclusion", "failure");
  } else {
    const summary = "All new links passed the check!";
    core.setOutput(
      "output",
      JSON.stringify(
        checks.length > 0
          ? {
              summary,
              text_description,
            }
          : { summary }
      )
    );
    core.setOutput("conclusion", "success");
  }

  process.exit(0);
}
main();
