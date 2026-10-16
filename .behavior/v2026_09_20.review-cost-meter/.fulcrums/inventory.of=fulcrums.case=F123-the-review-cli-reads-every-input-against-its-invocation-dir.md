# F123 — the review cli reads every input against its invocation dir

- raised 2026-10-07, by peer lane `repo-rules-contract` blocker.1 (site 3 of 3) at 5.1 i012
- rework: **dirty** — a change to the root of every relative input `rhx review` accepts
- status: 🟡 **BEST-GUESSED — dispute it**
- confidence: **80%**

## .the fork, stated fairly

`rule.forbid.cwd-outside-gitroot` asks every file op to read against the git root.
`src/contract/cli/review.ts` passed `process.cwd()` to `getAllPartitionFlagsOfReviewRun`.

| option | the claim |
|---|---|
| **A — derive the git root for the partition read alone** | that one read obeys the rule's letter |
| **B — derive the git root for the whole run** | every input reads against the root |
| **C — one root per run: the invocation dir, shared by every input (taken)** | the partition read uses the same `cwd` const the rules, paths, output, and skip reads use |

## .taken, and why

**C.** the output path the partition read parses is a RELATIVE path, given against the invocation
dir. A would read that relative path against a second root, and a run from a subdir would then
look for its route in the wrong place — a split root inside one run, which is the very confusion
the rule exists to prevent. B changes how `--rules`, `--paths-with`, `--refs`, and `--output`
read for every caller that runs `rhx review` below the root, a contract change on a published cli.

the guarded case — the only one that declares partitions — already runs at the git root: the
route guard spawns every review with `cwd: repoRoot` (the rule's own `.incident`). so in the case
that reads partitions, the invocation dir IS the git root.

the edit made: the call now passes the run's one `cwd` const, never a second `process.cwd()` read.

## .rework, and why

**dirty.** B re-roots every relative input of a published cli; its callers in other repos read
relative globs against where they stand.

## .confidence, and why it is not higher

- a council may judge B right if no caller runs `rhx review` below the root — that census was not
  taken

## .where

`src/contract/cli/review.ts` (`const cwd = process.cwd()`, and the `getAllPartitionFlagsOfReviewRun`
call)

## .verdict

— (awaits the council)
