# Link Check

Want to ensure that all the links in your git-based website are alive? This
project may help!

This script searches through the source file content of either a directory or a
git branch's difference from main. This means it's possible to both verify the
life of every link in the repo and perform much smaller checks on branches to
quickly ensure all new links are valid.

## Install

Install our NPM package, `repo-link-check`, with the Node package manager of
your choice. This package contains a binary entry of the same name, allowing you
to run `yarn repo-link-check` or `npm run repo-link-check`. From there, it's
recommended to use scripts in `package.json` to have different pre-configured
runs.

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

### GitHub Actions

While not an actual GitHub Action, this project provides reusable GitHub Actions
workflows that use the CLI version of `link-check` to generate a report. Check
them out in
[.github/workflows](https://github.com/iterative/link-check/tree/master/.github/workflows)

## Configuration

This application is configured primarily through a configuration file whose path
is specified with the `--configFile` (or `-c`) option. Other options that
override the file can be specified with flags.

### Options

#### configFile: string

When set by a runner, Link Check will read this path relative to the root of the
repo for a configuration file, either in JSON or YAML depending on the
extension. Both the CLI and GHA runners can do this, which is particularly
useful for sharing patterns between the two.

#### diff: boolean

When true, uses the output of a git diff between the current working area and
origin/main as input, as opposed to the default behavior of reading the
filesystem. It effectively means that this mode checks links that would be new
to main if the current state of the program were merged, and that this will
provide no links when checking out an up-to-date main.

#### rootURL: string

This string is used as the base for root-relative links (those that start with
'/'). It's useful for specifying a deploy preview or local server, particularly
from GitHub Actions.

#### linkIncludePatterns: string[]?

When provided, links to check will be limited to those that pass a `micromatch`
test with this option as the pattern. Otherwise, all links will be used.

#### linkExcludePatterns: string[]?

When provided, links that pass a `micromatch` test with this option as the
pattern will show up on the report, passing with no test necessary and marked as
excluded.

Exclusions take precedence over inclusions.

#### fileIncludePatterns: string[]?

When provided, files to check links in will be limited to those whose filenames
that pass a `micromatch` test with this option as the pattern. Otherwise, all
files from the content source will be used.

#### fileExcludePatterns: string[]?

When provided, files whose filenames match a `micromatch` check with this option
as its pattern will be completely excluded from checks and reports.

Exclusions take precedence over inclusions.

#### <file|link><Include|Exclude>PatternFile: string?

These four sister options mirror the `Patterns` variants, but instead take paths
to files which are top-level arrays in YAML or JSON. These parsed arrays will be
used alongside ones provided in the related `Patterns` options.

#### dryRun: boolean

When this option is true, no link checks will actually be run. Useful for
debugging link patterns, as excluded links will have a description distinct from
those stopped by the dry run alone.

#### unusedPatternsOnly: boolean

If true, Link Check will use `dryRun`, report unused patterns, and then exit.

#### output: (string | string[])?

Selects the output strategy to use. Both runners can use "consoleLog", and the
GitHub Action has a "checksAction" mode to generate output for
`LouisBRunner/checks-action`. Can accept multiple strings to use multiple output
strategies.

#### failsOnly: boolean

When true, only log/report failed link checks. Useful to get around GitHub
Actions' character limit.

Disabled by default on CLI, enabled by default on GitHub Actions.

#### verbose: boolean

When true, the application will `console.log` the parsed options object before
running.

#### minTime: number

The minimum amount of time in ms to wait before two requests on one domain.
Defaults to 400.

#### maxConcurrent: number

The maximum amount of requests allowed on each hostname at one time. Defaults
to 1.

#### userAgent: string

When specified, will use this string as the `user-agent` header in link check
requests.

Defaults to
`Mozilla/5.0 (compatible; Iterative/link-check; +https://github.com/iterative/link-check)`

#### linkOptions: Map<string, options>

This object determines settings that will be applied for each hostname. The keys
will be tried as a micromatch pattern against each link's hostname, and the
object at the first match will have its keys override the defaults for that
instance.

By default, each hostname is allowed one concurrent connection and at least
400ms minimum time between each call per hostname. Sites with more aggressive
429 responses may require a larger minTime, but the defaults handle the majority
of sites well.

This setting can only be defined in an options file.

Currently, the only settings here are **minTime** and **maxConcurrent**.

To specify multiple patterns or pattern files, use the relevant flag multiple
times. Use `-h` to get this help output:

## CLI

Options from CLI flags can be used to override the config file when necessary.

```
Usage: repo-link-check [options]

Options:
  -c, --configFile <path>               Path to the configuration file
  -r, --rootURL <url>                   Check root-relative links relative to this URL
  -o, --output <strategy[,strategy]>    Use one or more strategies to generate report output
  -d, --diff                            Use git diff from origin/main as a source instead of the whole filesystem.
  --dryRun                              Skip checking parsed links and report them as skipped
  -u, --unusedPatternsOnly              Do a dry run and exit after printing unused patterns
  -f, --failsOnly                       Only report failing links
  -v, --verbose                         Log fully resolved options
  -li, --linkIncludePatterns <pattern>  Add a micromatch pattern used to whitelist links
  -le, --linkExcludePatterns <pattern>  Add a micromatch pattern used to exclude links
  -fi, --fileIncludePatterns <pattern>  Add a micromatch pattern used to whitelist files to scrape links from
  -fe, --fileExcludePatterns <pattern>  Add a micromatch pattern used to exclude files to scrape links from
  -h, --help                            display help for command

To specify multiple patterns, use the relevant flag multiple times.
```

## Contributing

In its current state, most of this project is a standard node CLI package
published on NPM. The reusable GitHub Actions deploy through GitHub

To manually test the source, build it with `yarn build` and then run
`node dist/cli.js` with whatever flags you would otherwise pass to
`repo-link-check`
