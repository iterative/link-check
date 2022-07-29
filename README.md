# Link Check

Want to ensure that all the links in your git-based website are alive? This
project may help!

This script searches through the source file content of either a directory or a
git branch's difference from main. This means it's possible to both verify the
life of every link in the repo and perform much smaller checks on branches to
quickly ensure all new links are valid.

## Installation

Install `repo-link-check`, which contains a binary entry of the same name. From
there, it's recommended to use the binary in `package.json` scripts with options
for the site in question.

For example:

```json
    "link-check": "repo-link-check -c config/link-check/config.yml -s filesystem -u",
    "link-check-diff": "repo-link-check -c config/link-check/config.yml",
    "link-check-dev-server": "repo-link-check -c config/link-check/config.yml -r http://localhost:3000",
    "link-check-exclude": "repo-link-check -c config/link-check/config.yml -s filesystem -u only"
```

This setup checks all files in the project-relative directory `/content` with
`.css`, `.md`, and `.json` extensions for links, resolve root-relative links to
be relative to `https://www.example.com` and excluding files based on the lines
in `.config/exclude-files` and `.config.exclude-links`
