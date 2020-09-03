/* eslint-disable camelcase */
// eslint-disable-next-line import/no-extraneous-dependencies
import core from "@actions/core";
import { ChecksReport, LinkCheckOptions, FileChecksEntry } from "../types";
import formatEntries from "../formatEntries";

interface CheckOutput {
  summary: string;
  text_description?: string;
}

const combineSegments = (segments: string[], sep: string): string =>
  segments && segments.length > 0 ? segments.join(sep) : undefined;

function conclude({
  success,
  conclusion = success ? "success" : "failure",
  summarySegments,
  descriptionSegments,
  summary = combineSegments(summarySegments, ", "),
  description = combineSegments(descriptionSegments, "\n\n"),
}: {
  success?: boolean;
  conclusion?: "success" | "failure";
  summarySegments?: string[];
  descriptionSegments?: string[];
  summary?: string;
  description?: string;
}) {
  core.setOutput("conclusion", conclusion);
  const output: CheckOutput = { summary };
  if (description) output.text_description = description;
  core.setOutput("output", JSON.stringify(output));
}

function reduceCheckEntriesToErrors(
  entries: FileChecksEntry[]
): FileChecksEntry[] {
  return entries.reduce((acc, { filePath, checks }) => {
    const failingEntries = checks.filter((check) => !check.pass);
    return failingEntries.length > 0
      ? [
          ...acc,
          {
            filePath,
            checks: failingEntries,
          },
        ]
      : acc;
  }, []);
}

function checkActionReporter(
  { totalChecks, failedChecks, entries, unusedPatterns }: ChecksReport,
  { reportUnusedPatterns }: LinkCheckOptions
): void {
  const summarySegments = [];
  const descriptionSegments = [];

  if (totalChecks === 0) {
    return conclude({
      summary: "There were no files to check links in.",
      success: true,
    });
  }

  if (failedChecks === 0) {
    return conclude({
      summary: "All links passed the check!",
      success: true,
    });
  }

  if (reportUnusedPatterns && unusedPatterns.length > 0) {
    const patternLines = unusedPatterns
      .map((pattern) => `  - ${pattern}`)
      .join("\n\n");
    summarySegments.push(`Some link patterns were unused`);
    descriptionSegments.push(`# Unused match patterns\n\n${patternLines}`);
    if (reportUnusedPatterns === "only") {
      return conclude({
        summarySegments,
        descriptionSegments,
        success: false,
      });
    }
  }

  const hasError = failedChecks > 0;
  if (hasError) {
    const failEntries = reduceCheckEntriesToErrors(entries);
    summarySegments.push("Some new links failed the check.");
    descriptionSegments.push(
      `# Failed checks\n\n${formatEntries(failEntries, {
        fileFormat: ({ filePath }) => `* ${filePath}\n`,
        linkFormat: ({ link, href, description }) =>
          `  - ${link}${
            href && href !== link ? ` = ${href}` : ""
          } (${description})`,
      })}`
    );
  } else {
    summarySegments.push("All new links passed the check!");
  }

  return conclude({
    summarySegments,
    descriptionSegments,
    success: !hasError,
  });
}

export default {
  name: "checkAction",
  reporter: checkActionReporter,
};
