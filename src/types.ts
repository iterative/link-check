export interface FileEntry {
  filePath: string;
}

export interface StringFilter {
  (subject: string): boolean;
}

export interface FileContentEntry extends FileEntry {
  content:
    | string
    | string[]
    | ((filePath?: string) => string | string[] | Promise<string | string[]>);
}

export interface FileChecksEntry extends FileEntry {
  checks: CheckedLink[];
}

interface CoreLinkCheckOptions {
  source?: string;
  rootURL?: string;
  reportUnusedPatterns?: boolean | "only";
  dryRun?: boolean;
  verbose?: boolean;
  alwaysExitZero?: boolean;
  bottlenecks?: Map<string, BottleneckOptions>;
  failOnUnusedPatterns?: boolean;
}

export interface LinkCheckOptions extends CoreLinkCheckOptions {
  linkIncludePatterns?: string[];
  linkExcludePatterns?: string[];
  fileIncludePatterns?: string[];
  fileExcludePatterns?: string[];
  output?: string[];
}

export interface UnresolvedLinkCheckOptions extends CoreLinkCheckOptions {
  linkIncludePatterns?: string | string[];
  linkExcludePatterns?: string | string[];
  fileIncludePatterns?: string | string[];
  fileExcludePatterns?: string | string[];
  linkIncludePatternFiles?: string | string[];
  linkExcludePatternFiles?: string | string[];
  fileIncludePatternFiles?: string | string[];
  fileExcludePatternFiles?: string | string[];
  output?: string[] | string;
}

export interface LinkCheckArgs {
  link: string;
  url: URL;
}

export interface CheckedLink {
  link: string;
  pass: boolean;
  description?: string;
  href?: string;
}

export interface BottleneckOptions {
  minTime: number;
  maxConcurrent: number;
}

export interface ChecksReport {
  totalChecks: number;
  failedChecks: number;
  entries: FileChecksEntry[];
  unusedPatterns: string[];
}
