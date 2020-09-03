export default function combineSegments(
  segments: string[],
  sep = "\n\n"
): string {
  return segments && segments.length > 0
    ? segments.filter(Boolean).join(sep)
    : undefined;
}
