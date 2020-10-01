/* eslint-disable camelcase */
// eslint-disable-next-line import/no-extraneous-dependencies
import * as core from "@actions/core";
import { ChecksReport, LinkCheckOptions } from "../types";
import formatEntries from "../formatEntries";
import combineSegments from "./combineSegments";

interface CheckOutput {
  summary: string;
  text_description?: string;
}

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

const fileFormat = ({ filePath }) => `* ${filePath}\n`;

const linkFormatWithStatus = ({ link, href, description, pass }) =>
  `  - ${pass ? ":heavy_check_mark:" : ":x:"} ${link}${
    href && href !== link ? ` = ${href}` : ""
  } (${description})`;

const linkFormatWithoutStatus = ({ link, href, description }) =>
  `  - ${link}${href && href !== link ? ` = ${href}` : ""} (${description})`;

function checksActionReporter(
  {
    totalChecksCount,
    failedChecksCount,
    entries,
    failedEntries,
    unusedPatterns,
  }: ChecksReport,
  { unusedPatternsOnly, failsOnly, diff }: LinkCheckOptions
): void {
  const summarySegments = [];
  const descriptionSegments = [];
  const outputEntries = failsOnly ? failedEntries : entries;
  const formatterOptions = {
    fileFormat,
    linkFormat: failsOnly ? linkFormatWithoutStatus : linkFormatWithStatus,
  };

  if (totalChecksCount === 0) {
    return conclude({
      summary: "There were no links to check.",
      success: true,
    });
  }

  if (failedChecksCount === 0) {
    return conclude({
      summary: "All links passed the check!",
      success: true,
    });
  }

  if (!diff && unusedPatterns.length > 0) {
    const unusedPatternsBody = unusedPatterns
      .map((pattern) => `  - ${pattern}`)
      .join("\n\n");
    descriptionSegments.push(
      `# Unused link exclusion patterns`,
      unusedPatternsBody
    );
  }

  if (unusedPatternsOnly) {
    if (unusedPatterns.length === 0) {
      summarySegments.push("All link patterns were used");
    } else {
      summarySegments.push(`Some link patterns were unused`);
    }
    return conclude({
      summarySegments,
      descriptionSegments,
      success: false,
    });
  }

  const hasError = failedChecksCount > 0;
  const checksHeading = failsOnly ? "# Failed Link Checks" : "# Link Checks";
  if (hasError) {
    summarySegments.push("Some new links failed the check.");
    descriptionSegments.push(
      checksHeading,
      formatEntries(outputEntries, formatterOptions)
    );
  } else {
    summarySegments.push("All new links passed the check!");
    if (!failsOnly)
      descriptionSegments.push(
        checksHeading,
        formatEntries(outputEntries, formatterOptions)
      );
  }

  return conclude({
    summarySegments,
    descriptionSegments,
    success: !hasError,
  });
}

export const name = "checksAction";
export const reporter = checksActionReporter;
