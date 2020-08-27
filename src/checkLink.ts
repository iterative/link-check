import fetch from "node-fetch";
import mm from "micromatch";
import Bottleneck from "bottleneck";
import {
  CheckLinkArgs,
  CheckLinkOptions,
  LinkCheck,
  BottleneckOptions,
} from "./types";

const hostBottlenecks = {};
const getBottleneck = (hostname: string, options: CheckLinkOptions) => {
  if (!hostBottlenecks[hostname]) {
    const bottleneckOverrideEntry = Object.entries(
      options.bottlenecks
    ).find(([pattern]) => mm.isMatch(hostname, pattern));
    const {
      minTime = 400,
      maxConcurrent = 1,
    }: BottleneckOptions = bottleneckOverrideEntry
      ? bottleneckOverrideEntry[1]
      : {};
    hostBottlenecks[hostname] = new Bottleneck({ minTime, maxConcurrent });
  }
  return hostBottlenecks[hostname];
};

const bottleneckedFetch: (
  url: URL,
  fetchOptions: { method: string },
  options: CheckLinkOptions
) => Promise<Response> = async (url, fetchOptions, options) =>
  getBottleneck(url.hostname, options).schedule(() =>
    fetch(url.href, fetchOptions)
  );

const fetchWithRetries = async (
  url: URL,
  fetchOptions = {},
  options: CheckLinkOptions
) => {
  const res = await bottleneckedFetch(
    url,
    { ...fetchOptions, method: "HEAD" },
    options
  );
  if (res.status === 405) {
    return bottleneckedFetch(url, { ...fetchOptions, method: "GET" }, options);
  }
  if (res.status === 429) {
    const retryAfter = res.headers.get("retry-after");
    if (retryAfter) {
      const retryMs = Number(retryAfter) * 1000;
      return new Promise((resolve) => {
        setTimeout(async () => {
          resolve(await fetchWithRetries(url, fetchOptions, options));
        }, retryMs);
      });
    }
  }
  return res;
};

const memo = {};
const memoizedFetch = async (url: URL, options: CheckLinkOptions) => {
  const { href } = url;
  const existing = memo[href];
  if (existing) {
    return existing;
  }
  memo[href] = fetchWithRetries(url, {}, options);
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
  return allPatterns
    ? allPatterns.filter((x: string) => !usedExcludePatterns.has(x))
    : [];
};

const checkLink: (
  linkDef: CheckLinkArgs,
  options: CheckLinkOptions
) => Promise<LinkCheck> = async ({ link, url }, options) => {
  const { linkIncludePatterns, linkExcludePatterns, dryRun } = options;
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
      const { status, ok } = await memoizedFetch(url, options);
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
