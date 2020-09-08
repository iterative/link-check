import fs from "fs";

export const transformFileContents = async <T>(
  filePath: string,
  transform: (data: string | Buffer) => T
): Promise<T> =>
  new Promise((resolve, reject) => {
    fs.readFile(filePath, "utf-8", (err, data) => {
      if (err) reject(err);
      resolve(transform(data));
    });
  });

export async function asyncMap<I, O = I>(
  collection: I[],
  iteratee: (input: I, idx?: number) => Promise<O> | O
): Promise<O[]> {
  return Promise.all(collection.map(iteratee));
}
