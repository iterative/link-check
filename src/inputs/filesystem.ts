import glob from "fast-glob";
import fs from "fs";
import { FileContentEntry, LinkCheckOptions } from "../types";

async function contentFromFilesystem({
  fileIncludePatterns,
  fileExcludePatterns,
}: LinkCheckOptions): Promise<FileContentEntry[]> {
  const filePaths = await glob(fileIncludePatterns, {
    ignore: fileExcludePatterns,
  });
  return filePaths.map(
    (filePath: string) =>
      ({
        filePath,
        content: async (filePathArg: string) =>
          new Promise((resolve, reject) =>
            fs.readFile(filePathArg, (err, buffer) =>
              err ? reject(err) : resolve(String(buffer))
            )
          ),
      } as FileContentEntry)
  );
}

export default contentFromFilesystem;
