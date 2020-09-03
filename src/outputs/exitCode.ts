import { ChecksReport, LinkCheckOptions } from "../types";

function exitCodeReporter(
  report: ChecksReport,
  options: LinkCheckOptions
): void {
  const { failOnUnusedPatterns } = options;
  const { unusedPatterns, failedChecksCount } = report;
  if (failOnUnusedPatterns && unusedPatterns.length > 0) {
    process.exit(2);
  }
  if (failedChecksCount > 0) {
    process.exit(2);
  }
  process.exit(0);
}

export default {
  name: "exitCode",
  reporter: exitCodeReporter,
};
