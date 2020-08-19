# Link Check

Want to ensure that all the links in your git-based website are alive? This
project may help!

This script searches through the source file content of either a directory or a
git branch's difference from master. This means it's possible to both verify the
life of every link in the repo and perform much smaller checks on branches to
quickly ensure all new links are valid.

## Installation

### CLI

To get the CLI runner, install the NPM package `repo-link-check`, which contains
a binary entry of the same name. From there, it's recommended to use the binary
in `package.json` scripts with options for the site in question.

For example:

```json
    "link-check": "repo-link-check -r='https://www.example.com' --fi='content/**/*.{css,md,json}' --fef='./config/exclude-files' --lef='./config/exclude-links' -z",
    "link-check-all": "repo-link-check -r='https://www.example.com' --fi='{.github,content,src}/**/*.{css,js,jsx,md,tsx,ts,json}' --fef='./config/exclude-files' --lef='./config/exclude-links' -z -s=filesystem -u"
```

This setup checks all files in the project-relative directory `/content` with `.css`, `.md`, and `.json` extensions for links, resolve root-relative links to be relative to `https://www.example.com` and excluding files based on the lines in `.config/exclude-files` and `.config.exclude-links`

### GitHub Action

Here's a basic example of a workflow to run link checks after a deploy preview succeeds and output the result to a GitHub Check Run.

```yaml
name: My Link Check
on: deployment_status

jobs:
  run:
    name: Run Link Checker
    runs-on: ubuntu-latest
    if: github.event.deployment_status.state == 'success'

    steps:

    - uses: actions/checkout@v2

    - name: Run the link checker
      id: check
      uses: "iterative/link-check.action@0.1"
      with:
        rootURL: "${{ github.event.deployment.payload.web_url }}"
        linkExcludePatternFiles: "./config/exclude-links"
        fileExcludePatternFiles: "./config/exclude-files"
        fileIncludePatterns: "content/**/*.{css,md,json}"

    - uses: LouisBrunner/checks-action@v0.1.0
      with:
        token: ${{ secrets.GITHUB_TOKEN }}
        name: Link Check
        status: completed
        conclusion: ${{ steps.check.outputs.conclusion }}
        output: ${{ steps.check.outputs.output }}
```

## Options

### source: "git-diff" | "filesystem" = "git-diff"

This string determines how the action will source content

"git-diff" uses the diff between the current working area and origin/master. It
effectively means that this mode checks links that would be new to master if the
current state of the program were merged, and that this will provide no links
when checking out an up-to-date master.

### rootURL: string

This string is used as the base for root-relative links (those that start with
'/'). It's useful for specifying a deploy preview or local server, particularly
from GitHub Actions.

### linkIncludePatterns: string[]?

When provided, links to check will be limited to those that pass a `micromatch`
test with this option as the pattern. Otherwise, all links will be used.

### linkExcludePatterns: string[]?

When provided, links that pass a `micromatch` test with this option as the
pattern will show up on the report, passing with no test necessary and marked as
excluded.

Exclusions take precedence over inclusions.

### fileIncludePatterns: string[]?

When provided, files to check links in will be limited to those whose filenames
that pass a `micromatch` test with this option as the pattern. Otherwise, all
files from the content source will be used.

### fileExcludePatterns: string[]?

When provided, files whose filenames match a `micromatch` check with this option
as its pattern will be completely excluded from checks and reports.

Exclusions take precedence over inclusions.

## Runners

### CLI

#### Link Check option flags

To specify multiple patterns or pattern files, use the relevant flag multiple times.

##### -s / --source
##### -r / --rootURL
##### --li / --link-include-pattern
##### --le / --link-exclude-pattern
##### --fi / --file-include-pattern
##### --fe / --file-exclude-pattern
##### --lif / --link-include-pattern-file
##### --lef / --link-exclude-pattern-file
##### --fif / --file-include-pattern-file
##### --fef / --file-exclude-pattern-file

#### CLI-specific options

##### -u / --report-unused-patterns

When finished with the link check, log link exclusion patterns that weren't used.
Generally, it only makes sense to use this on a full-repo filesystem check.

##### -v / --verbose

Log fully parsed options before starting. File-based patterns will have already
been resolved and combined with ones defined in arguments.

##### -z / --always-exit-zero

Normally, the CLI runners exits with code 2 if a link has failed. This means CI
applications running it from shell can break if a link fails.

With this option specified, the CLI checker will always exit with code 0. This
allows the link check to be run as optional in CI pipelines that run off exit
codes.

### GitHub Action

#### Link Check Option Inputs

To specify multiple patterns or pattern files, provide a JSON-parsable array of
strings as the relevant option's input.

##### rootURL
##### linkIncludePatternFiles
##### linkIncludePatterns
##### linkExcludePatternFiles
##### linkExcludePatterns
##### fileIncludePatternFiles
##### fileIncludePatterns
##### fileExcludePatternFiles
##### fileExcludePatterns

## Contributing

Despite the submodule, contributing is as simple as any standard repo.

To test out a source-built CLI runner, build it with `yarn build` and then run
`dist/cli.js` with `node` and the flags to test with in the directory of the
project to test on.

## Deploying

The multi-target nature of this repo makes deploying more complex than usual,
but still manageable if one knows how to do so.

Here's the current flow:

1. Run `yarn build` with desired changes
2. cd into the `github-action` subrepo
