import fetch from "node-fetch";

export interface CheckLinkOptions {
  rootURL: string;
  linkFilter: (subject: string) => boolean;
  link: string;
}

export interface LinkCheck {
  link: string;
  pass: boolean;
  description?: string;
  href?: string;
}

const getURL = (link: string, rootURL: string | URL) => {
  return new URL(
    /^(https?:\/)?\//.test(link) ? link : `https://${link}`,
    rootURL
  );
};

const fetchHeadOrGet = async (href: string) => {
  const res = await fetch(href, { method: "HEAD" });
  return res.status === 405 ? fetch(href) : res;
};

const memo = {};
const memoizedFetch = async (href: string) => {
  const existing = memo[href];
  if (existing) {
    return existing;
  } else {
    memo[href] = fetchHeadOrGet(href);
    return memo[href];
  }
};

const checkLink: (options: CheckLinkOptions) => Promise<LinkCheck> = async ({
  link,
  rootURL,
  linkFilter,
}) => {
  if (typeof linkFilter === "function" && !linkFilter(link)) {
    return {
      link,
      description: "Excluded",
      pass: true,
    };
  } else {
    const { href } = getURL(link, rootURL);
    try {
      const { status, ok } = await memoizedFetch(href);
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
          e.code && " " + e.code,
          e.message && ": " + e.message,
        ]
          .filter(Boolean)
          .join(""),
        pass: false,
      };
    }
  }
};

export default checkLink;
