import glob from "fast-glob";
import fs from "fs";
import { FileContentEntry } from "../checkFileEntries";

async function contentFromFilesystem({
  fileIncludePatterns = "**",
  fileExcludePatterns,
}: {
  fileIncludePatterns: string | string[];
  fileExcludePatterns: string | string[];
}): Promise<FileContentEntry[]> {
  const filePaths = await glob(fileIncludePatterns, {
    ignore: fileExcludePatterns,
  });
  return filePaths.map(
    (filePath: string) =>
      ({
        filePath,
        content: async (filePath: string) =>
          new Promise((resolve, reject) =>
            fs.readFile(filePath, (err, buffer) =>
              err ? reject(err) : resolve(String(buffer))
            )
          ),
      } as FileContentEntry)
  );
}

export default contentFromFilesystem;
