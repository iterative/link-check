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
  diff?: boolean;
  rootURL?: string;
  unusedPatternsOnly?: boolean;
  dryRun?: boolean;
  verbose?: boolean;
  linkOptions?: Map<string, LinkOptions>;
  failOnUnusedPatterns?: boolean;
  minTime?: number;
  maxConcurrent?: number;
}

export interface LinkCheckOptions extends CoreLinkCheckOptions {
  linkIncludePatterns?: string[];
  linkExcludePatterns?: string[];
  fileIncludePatterns?: string[];
  fileExcludePatterns?: string[];
  output?: string[];
  failsOnly?: boolean;
  origin?: string;
}

export interface UnresolvedLinkCheckOptions extends CoreLinkCheckOptions {
  linkIncludePatterns?: string | string[];
  linkExcludePatterns?: string | string[];
  fileIncludePatterns?: string | string[];
  fileExcludePatterns?: string | string[];
  linkIncludePatternFile?: string;
  linkExcludePatternFile?: string;
  fileIncludePatternFile?: string;
  fileExcludePatternFile?: string;
  output?: string[] | string;
  failsOnly?: boolean | "false";
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

export interface LinkOptions {
  minTime?: number;
  maxConcurrent?: number;
}

export interface ChecksReport {
  entries: FileChecksEntry[];
  totalChecksCount: number;
  failedEntries: FileChecksEntry[];
  failedChecksCount: number;
  unusedPatterns: string[];
}
