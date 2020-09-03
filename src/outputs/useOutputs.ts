import { ChecksReport, LinkCheckOptions } from "../types";

interface Reporter {
  (report: ChecksReport, options: LinkCheckOptions): void;
}

function useOutputs(
  availableOutputs: {
    name: string;
    reporter: Reporter;
  }[],
  options: LinkCheckOptions,
  report: ChecksReport
): void {
  const { output } = options;
  const selectedOutputs: string[] = Array.isArray(output) ? output : [output];

  availableOutputs.forEach(({ name, reporter }) => {
    if (selectedOutputs.includes(name)) reporter(report, options);
  });
}

export default useOutputs;
