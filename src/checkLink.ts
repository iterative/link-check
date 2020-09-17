import fetch from "node-fetch";
import mm from "micromatch";
import Bottleneck from "bottleneck";
import {
  LinkCheckArgs,
  LinkCheckOptions,
  CheckedLink,
  LinkOptions,
} from "./types";

const hostBottlenecks = {};
const getBottleneck = (hostname: string, options: LinkCheckOptions) => {
  if (!hostBottlenecks[hostname]) {
    const currentLinkOptionsEntry = Object.entries(
      options.linkOptions
    ).find(([pattern]) => mm.isMatch(hostname, pattern));
    const {
      minTime = options.minTime || 400,
      maxConcurrent = options.maxConcurrent || 1,
    }: LinkOptions = currentLinkOptionsEntry ? currentLinkOptionsEntry[1] : {};
    hostBottlenecks[hostname] = new Bottleneck({ minTime, maxConcurrent });
  }
  return hostBottlenecks[hostname];
};

const bottleneckedFetch: (
  url: URL,
  fetchOptions: { method: string },
  options: LinkCheckOptions
) => Promise<Response> = async (url, fetchOptions, options) =>
  getBottleneck(url.hostname, options).schedule(() =>
    fetch(url.href, fetchOptions)
  );

const fetchWithRetries = async (
  url: URL,
  fetchOptions = {},
  options: LinkCheckOptions
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
const memoizedFetch = async (url: URL, options: LinkCheckOptions) => {
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
  linkDef: LinkCheckArgs,
  options: LinkCheckOptions
) => Promise<CheckedLink> = async ({ link, url }, options) => {
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
      const checkedLink: Partial<CheckedLink> = {
        link,
        href,
        pass: false,
      };
      switch (e.code) {
        case "ENOTFOUND":
          checkedLink.description = "Site not found";
          break;
        default:
          checkedLink.description = [
            e.code || "Fetch Error",
            e.message && `: ${e.message}`,
          ]
            .filter(Boolean)
            .join("");
      }
      return checkedLink as CheckedLink;
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
