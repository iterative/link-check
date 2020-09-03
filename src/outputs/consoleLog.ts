import { ChecksReport, LinkCheckOptions } from "../types";
import formatEntries from "../formatEntries";

function conclude(outputSegments: string[]): void {
  console.log(outputSegments.join("\n\n"));
}

function consoleLogReporter(
  report: ChecksReport,
  options: LinkCheckOptions
): void {
  const { reportUnusedPatterns } = options;
  const { totalChecks, failedChecks, entries, unusedPatterns } = report;
  const outputSegments = [];

  if (totalChecks === 0) {
    outputSegments.push("There were no links to check!");
  } else {
    const reportBody = formatEntries(entries);

    if (reportUnusedPatterns) {
      if (unusedPatterns.length > 0) {
        outputSegments.push(
          `Some link ignore patterns were unused!\n\n${unusedPatterns.join(
            "\n"
          )}\n`
        );
      } else {
        outputSegments.push("All link patterns were used.");
      }
      if (reportUnusedPatterns === "only") {
        return conclude(outputSegments);
      }
    }

    if (failedChecks > 0) {
      outputSegments.push(`${reportBody}\n\n${failedChecks} links failed.`);
    } else {
      outputSegments.push(`${reportBody}\n\nAll links passed!`);
    }
  }

  return conclude(outputSegments);
}

export default {
  name: "consoleLog",
  reporter: consoleLogReporter,
};
