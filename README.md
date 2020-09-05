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

The Link Check can be run in a few different configurations to set when to check, and what to check for.

For example, these two workflows work together to generate a GitHub Check with checked links when a deployment finishes:

#### Check new links against each successful deployment

```yaml
# .github/workflows/link-check-init.yml

name: Link Check Deploy
on: deployment

jobs:
  run:
    name: Initialize
    runs-on: ubuntu-latest
    steps:
      - uses: LouisBrunner/checks-action@v0.1.0
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
          name: Check
          status: in_progress
          conclusion: neutral
          output: >-
            {"summary": "Waiting for deploy to finish"}
```

```yaml
# .github/workflows/link-check-deploy.yml

name: Link Check Deploy
on: deployment_status

jobs:
  run:
    name: Check
    runs-on: ubuntu-latest
    if: github.event.deployment_status.state == 'success'

    steps:
      - uses: actions/checkout@v2

      - name: Run the link check script
        id: check
        uses: "iterative/link-check.action@master"
        with:
          configFile: "./config/link-check/config.json"
          rootURL: "${{ github.event.deployment.payload.web_url }}"
          output: checkAction

      - uses: LouisBrunner/checks-action@v0.1.0
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
          name: Check
          status: completed
          conclusion: ${{ steps.check.outputs.conclusion }}
          output: ${{ steps.check.outputs.output }}
```

The initializer is run because `checks-action` doesn't attach its check to a
deployment when triggered via `deployment_status`

#### Check all links in the repo daily

This workflow ensures that all link exclusion patterns are used throughout the repo:

```
name: Link Check Deploy
on: deployment_status

jobs:
  run:
    name: Link Check Deploy
    runs-on: ubuntu-latest
    if: github.event.deployment_status.state == 'success'

    steps:

    - uses: actions/checkout@v2

    - name: Run the link check script
      id: check
      uses: "iterative/link-check.action@v0.3.0"
      with:
        configFile: "./.linkcheckrc.json"
        rootURL: "${{ github.event.deployment.payload.web_url }}"

    - uses: LouisBrunner/checks-action@v0.1.0
      with:
        token: ${{ secrets.GITHUB_TOKEN }}
        name: Link Check Deploy
        status: completed
        conclusion: ${{ steps.check.outputs.conclusion }}
        output: ${{ steps.check.outputs.output }}
```

## Options

### config: string

When set by a runner, Link Check will look for a JSON config file relative to
the root of the repo. Both the CLI and GHA runners can do this, which is
particularly useful for sharing patterns between the two.

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

### dryRun: boolean

When this option is true, no link checks will actually be run. Useful for
debugging link patterns, as excluded links will have a description distinct from
those stopped by the dry run alone.

### reportUnusedPatterns: boolean | "only"

If set to "only", applies dryRun and skips report logging after reporting unused patterns.
If otherwise true, unused link exclusion patterns will be logged to output.

### bottlenecks: Map<string, {minTime: number, maxConcurrent: number}

This object determines overrides for the settings of the Bottleneck instances
used for each hostname. The keys will be tried as a micromatch pattern against
each link's hostname, and the object at the first match will have its keys
override the defaults for that instance.

By default, Bottleneck instances only allow one concurrent connection and at
least 400ms minimum time between each call per hostname. Sites with more
aggressive 429 responses may require a larger minTime, but the defaults handle
the majority of sites well.

This setting can only be defined in an options file.

### output: string[]?

This is a list of output strategies to use on the current run. Both runners can
use "consoleLog" and "exitCode", and the GitHub Action has a third "checkAction"
mode to output to GitHub Actions.

### failsOnly: boolean

When true, only log/report failed link checks. Useful to get around GitHub
Actions' character limit.

Disabled by default on CLI, enabled by default on GitHub Actions.

### verbose: boolean

When true, the application will `console.log` the parsed options object before
running.

## Runners

### CLI

#### Link Check option flags

To specify multiple patterns or pattern files, use the relevant flag multiple times.

##### -c / --config

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

##### -d / --dry-run

##### -u / --report-unused-patterns

##### -o / --output

##### -f / --fails-only

##### -v / --verbose

Log fully parsed options before starting. File-based patterns will have already
been resolved and combined with ones defined in arguments.

### GitHub Action

The GitHub action accepts rootURL and all the pattern options as inputs.
Notably, the GitHub action only operates on git diffs.

To specify multiple patterns or pattern files, provide a JSON-parsable array of
strings as the relevant option's input.

##### configFile

##### rootURL

##### linkIncludePatternFiles

##### linkIncludePatterns

##### linkExcludePatternFiles

##### linkExcludePatterns

##### fileIncludePatternFiles

##### fileIncludePatterns

##### fileExcludePatternFiles

##### fileExcludePatterns

##### dryRun

##### reportUnusedPatterns

##### output

##### failsOnly

## Contributing

Despite the submodule, contributing is as simple as any standard repo.

To test out a source-built CLI runner, build it with `yarn build` and then run
`dist/cli.js` with `node` and the flags to test with in the directory of the
project to test on.

## Deploying

The multi-target nature of this repo makes deploying more complex than usual,
but still manageable if one knows how to do so.

Here's the current flow to build and deploy a change to the action:

1. Run `yarn build` with desired changes.

2. If the rebuild caused the `github-action` submodule to change, cd in and commit the changes.

3. Add the changed submodule, then commit the whole thing.

4. Push with `--recurse-submodules=on-demand`, or otherwise push both repos.

The CLI, on the other hand, is the standard `yarn build` and `yarn publish`.
