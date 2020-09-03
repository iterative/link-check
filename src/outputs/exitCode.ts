import { ChecksReport, LinkCheckOptions } from "../types";

function exitCodeReporter(
  report: ChecksReport,
  options: LinkCheckOptions
): void {
  const { failOnUnusedPatterns, reportUnusedPatterns } = options;
  const { unusedPatterns, failedChecks } = report;
  // Exit with a failing code
  if (
    (failOnUnusedPatterns || reportUnusedPatterns === "only") &&
    unusedPatterns.length > 0
  ) {
    process.exit(3);
  }
  if (failedChecks > 0) {
    process.exit(2);
  }
  process.exit(0);
}

export default {
  name: "exitCode",
  reporter: exitCodeReporter,
};
