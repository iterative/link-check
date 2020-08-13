import mm from "micromatch";
import fs from "fs";
import path from "path";

const mmOptions = { bash: true };

const buildFilter = (
  include: string | string[],
  exclude: string | string[]
) => (subject) => {
  return mm.isMatch(subject, include, {
    ignore: exclude,
  });
};

export default buildFilter;
