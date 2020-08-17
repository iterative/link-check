import fetch from "node-fetch";
import mm from "micromatch";
import Bottleneck from "bottleneck";
import { CheckLinkArgs, LinkCheck } from "./types";

const hostBottlenecks = {};
const getBottleneck = ({ host, minTime = 250, maxConcurrent }) => {
  if (!hostBottlenecks[host]) {
    hostBottlenecks[host] = new Bottleneck({ minTime, maxConcurrent });
  }
  return hostBottlenecks[host];
};

const bottleneckedFetch: (
  url: URL,
  options: { method: string }
) => Promise<Response> = async (url, options) =>
  getBottleneck({ host: url.host }).schedule(() => fetch(url.href, options));

const fetchHeadOrGet = async (url: URL) => {
  const res = await bottleneckedFetch(url, { method: "HEAD" });
  if (res.status === 405) {
    return bottleneckedFetch(url, { method: "GET" });
  }
  if (res.status === 429) {
    const retryAfter = res.headers.get("retry-after");
    if (retryAfter) {
      const retryMs = Number(retryAfter) * 1000;
      return new Promise((resolve) => {
        setTimeout(async () => {
          resolve(await fetchHeadOrGet(url));
        }, retryMs);
      });
    }
  }
  return res;
};

const memo = {};
const memoizedFetch = async (url: URL) => {
  const { href } = url;
  const existing = memo[href];
  if (existing) {
    return existing;
  }
  memo[href] = fetchHeadOrGet(url);
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
