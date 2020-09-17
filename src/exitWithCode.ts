import { ChecksReport, LinkCheckOptions } from "./types";

function exitWithCode(report: ChecksReport, options: LinkCheckOptions): void {
  const { unusedPatternsOnly } = options;
  const { unusedPatterns, failedChecksCount } = report;
  if (unusedPatternsOnly && unusedPatterns.length > 0) {
    process.exit(2);
  }
  if (failedChecksCount > 0) {
    process.exit(2);
  }
  process.exit(0);
}

export default exitWithCode;
