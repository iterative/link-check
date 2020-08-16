import mm from "micromatch";

const buildFilter = (
  include: string | string[],
  exclude: string | string[]
) => (subject: string): boolean => {
  return mm.isMatch(subject, include, {
    ignore: exclude,
    bash: true,
  });
};

export default buildFilter;
