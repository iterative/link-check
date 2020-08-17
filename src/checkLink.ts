import fetch from "node-fetch";
import mm from "micromatch";
import { CheckLinkArgs, LinkCheck } from "./types";

const fetchHeadOrGet = async (href: string) => {
  const res = await fetch(href, { method: "HEAD" });
  return res.status === 405 ? fetch(href) : res;
};

const memo = {};
const memoizedFetch = async (href: string) => {
  const existing = memo[href];
  if (existing) {
    return existing;
  }
  memo[href] = fetchHeadOrGet(href);
  return memo[href];
};

const checkLink: (options: CheckLinkArgs) => Promise<LinkCheck> = async ({
  link,
  url,
  linkIncludePatterns,
  linkExcludePatterns,
  limiter,
}) => {
  if (
    mm.isMatch(link, linkIncludePatterns, {
      ignore: linkExcludePatterns,
      bash: true,
    })
  ) {
    const { href } = url;
    try {
      const { status, ok } = await (limiter
        ? limiter.schedule(() => memoizedFetch(href))
        : memoizedFetch(href));
      return {
        link,
        // omit href if it and link are the exact same
        href: link === href ? null : href,
        description: status,
        pass: ok,
      };
    } catch (e) {
      return {
        link,
        href,
        description: [
          "Error",
          e.code && ` ${e.code}`,
          e.message && `: ${e.message}`,
        ]
          .filter(Boolean)
          .join(""),
        pass: false,
      };
    }
  } else {
    return {
      link,
      description: "Excluded",
      pass: true,
    };
  }
};

export default checkLink;
