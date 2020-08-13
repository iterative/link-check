export interface FileEntry {
  filePath: string;
}

export interface FileContentEntry extends FileEntry {
  content: string | string[];
}

export interface FileChecksEntry extends FileEntry {
  checks: LinkCheck[];
}
