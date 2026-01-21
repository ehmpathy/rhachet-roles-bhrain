# review tactics

## purpose

the reviewer role performs automated code review against declared rules, using claude-code as the underlying brain.

## modes

### pull mode

- includes only file paths in the prompt
- instructs brain to read files directly
- lower token usage
- best for: large codebases, exploratory reviews

### push mode

- includes full file contents in the prompt
- no additional file reads required
- higher token usage, faster execution
- best for: focused reviews, smaller scopes

## mode selection criteria

use `--pull` when:
- scope is large (>50 files)
- context window would exceed 60%
- reviewing for general patterns

use `--push` when:
- scope is small (<20 files)
- precision is critical
- reviewing specific changes

## context window thresholds

- **60% warning**: emits warning but continues
- **75% failfast**: throws error with recommendation to reduce scope or use pull mode

## scope combination

targets are the union of `--diffs` and `--paths`:
- `--diffs uptil-main`: files changed since main branch
- `--diffs uptil-staged`: only staged files
- `--paths`: explicit glob patterns

## artifacts

all invocations log to `.log/bhrain/review/$timestamp/`:
- `input.args.json`: original arguments and computed metrics
- `input.prompt.md`: exact prompt sent to brain
- `output.response.json`: raw brain response
- `output.review.md`: formatted review output

## output format

reviews follow the feedback template format:
- blockers appear first (severity: blocker)
- nitpicks appear second (severity: nitpick)
- each finding includes file path and line number when available
