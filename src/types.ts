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
  checks: LinkCheck[];
}

interface CoreCheckLinkOptions {
  source?: string;
  rootURL?: string;
  reportUnusedPatterns?: boolean | "only";
  dryRun?: boolean;
  verbose?: boolean;
  alwaysExitZero?: boolean;
}

export interface CheckLinkOptions extends CoreCheckLinkOptions {
  linkIncludePatterns?: string[];
  linkExcludePatterns?: string[];
  fileIncludePatterns?: string[];
  fileExcludePatterns?: string[];
}

export interface UnresolvedCheckLinkOptions extends CoreCheckLinkOptions {
  linkIncludePatterns?: string | string[];
  linkExcludePatterns?: string | string[];
  fileIncludePatterns?: string | string[];
  fileExcludePatterns?: string | string[];
  linkIncludePatternFiles?: string | string[];
  linkExcludePatternFiles?: string | string[];
  fileIncludePatternFiles?: string | string[];
  fileExcludePatternFiles?: string | string[];
}

export interface CheckLinkArgs extends CheckLinkOptions {
  link: string;
  url: URL;
}

export interface LinkCheck {
  link: string;
  pass: boolean;
  description?: string;
  href?: string;
}

export interface OnCheckAPI {
  link: string;
  url: URL;
}

export interface AfterCheckAPI extends OnCheckAPI {
  check: LinkCheck;
}

export interface LinkCheckRateLimiter {
  pattern: string | string[];
  queue: unknown;
}
