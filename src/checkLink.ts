import fetch from "node-fetch";
import mm from "micromatch";
import Bottleneck from "bottleneck";
import { CheckLinkArgs, LinkCheck } from "./types";

const hostBottlenecks = {};
const getBottleneck = ({ host, minTime = 1000, maxConcurrent = 1 }) => {
  if (!hostBottlenecks[host]) {
    hostBottlenecks[host] = new Bottleneck({ minTime, maxConcurrent });
  }
  return hostBottlenecks[host];
};

const fetchHeadOrGet = async ({ href }: URL) => {
  const res = await fetch(href, { method: "HEAD" });
  return res.status === 405 ? fetch(href) : res;
};

const bottleneckedFetch = async (url: URL) =>
  getBottleneck({ host: url.host }).schedule(() => fetchHeadOrGet(url));

const memo = {};
const memoizedFetch = async (url: URL) => {
  const { href } = url;
  const existing = memo[href];
  if (existing) {
    return existing;
  }
  memo[href] = bottleneckedFetch(url);
  return memo[href];
};

const checkLink: (options: CheckLinkArgs) => Promise<LinkCheck> = async ({
  link,
  url,
  linkIncludePatterns,
  linkExcludePatterns,
}) => {
  if (
    mm.isMatch(link, linkIncludePatterns, {
      ignore: linkExcludePatterns,
      bash: true,
    })
  ) {
    const { href } = url;
    try {
      const { status, ok } = await memoizedFetch(url);
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
