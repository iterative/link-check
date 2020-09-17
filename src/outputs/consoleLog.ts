import { ChecksReport, LinkCheckOptions } from "../types";
import formatEntries from "../formatEntries";
import combineSegments from "./combineSegments";

function conclude(outputSegments: string[]): void {
  console.log(combineSegments(outputSegments));
}

function consoleLogReporter(
  report: ChecksReport,
  options: LinkCheckOptions
): void {
  const { unusedPatternsOnly, failsOnly } = options;
  const {
    totalChecksCount,
    failedChecksCount,
    entries,
    failedEntries,
    unusedPatterns,
  } = report;
  const outputSegments = [];

  const outputEntries = failsOnly ? failedEntries : entries;

  if (totalChecksCount === 0) {
    outputSegments.push("There were no links to check!");
  } else {
    const reportBody = formatEntries(outputEntries, { failsOnly });

    if (unusedPatterns.length > 0) {
      outputSegments.push(
        `Some link ignore patterns were unused!\n\n${unusedPatterns.join("\n")}`
      );
    }

    if (unusedPatternsOnly) {
      if (unusedPatterns.length === 0) {
        outputSegments.push("All link patterns were used.");
      }
      return conclude(outputSegments);
    }

    outputSegments.push(reportBody);
    if (failedChecksCount > 0) {
      outputSegments.push(
        `${failedChecksCount}/${totalChecksCount} links failed.`
      );
    } else {
      outputSegments.push(`All ${totalChecksCount} links passed!`);
    }
  }

  return conclude(outputSegments);
}

export const name = "consoleLog";
export const reporter = consoleLogReporter;
