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

const bottleneckedFetch: (
  url: URL,
  options: { method: string }
) => Promise<Response> = async (url, options) =>
  getBottleneck({ host: url.host }).schedule(() => fetch(url.href, options));

const fetchWithRetries = async (url: URL) => {
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
          resolve(await fetchWithRetries(url));
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
  memo[href] = fetchWithRetries(url);
  return memo[href];
};

const usedExcludePatterns: Set<string> = new Set();
const isMatch = (
  link: string,
  includePatterns: string | string[],
  { ignore: excludePatterns, ...options }
): boolean => {
  if (mm.isMatch(link, includePatterns, options)) {
    if (excludePatterns) {
      if (Array.isArray(excludePatterns)) {
        const excludingPattern = excludePatterns.find((excludePattern) =>
          mm.isMatch(link, excludePattern, options)
        );
        if (excludingPattern) {
          usedExcludePatterns.add(excludingPattern);
          return false;
        }
      } else if (mm.isMatch(link, excludePatterns, options)) {
        usedExcludePatterns.add(excludePatterns);
        return false;
      }
    }
    return true;
  }
  return false;
};

export const getUnusedLinkExcludePatterns = (
  allPatterns: string[]
): string[] => {
  return allPatterns.filter((x: string) => !usedExcludePatterns.has(x));
};

const checkLink: (options: CheckLinkArgs) => Promise<LinkCheck> = async ({
  link,
  url,
  linkIncludePatterns,
  linkExcludePatterns,
  dryRun,
}) => {
  if (
    isMatch(link, linkIncludePatterns, {
      ignore: linkExcludePatterns,
      bash: true,
    })
  ) {
    const { href } = url;
    if (dryRun) {
      return {
        link,
        href: link === href ? null : href,
        description: "Skipped because of dry-run",
        pass: true,
      };
    }
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
