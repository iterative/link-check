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

export interface CheckLinkOptions {
  rootURL: string;
  linkFilter?: (subject: string) => boolean;
}

export interface CheckLinkArgs {
  link: string;
  url: URL;
  linkFilter?: (subject: string) => boolean;
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
