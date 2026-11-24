# fulcrum F9: the `approved?` halt keeps its stdout stream

## .the fork

this pr extracts the `approved?` judge halt into `asJudgeApprovalHaltLines` so its owner line can be pinned. the halt prints to stdout before `exit(2)`; the `reviewed?` halt prints to stderr.

- **A — move no byte**: the extraction is a pure refactor. the stream stays stdout
- **B — move the halt to stderr**: match `judgeReviewed`, per `rule.forbid.stdout-on-exit-errors`

## .taken: A

- the wish names the urgent halt's owner line. the approval halt is a human's surface by design (`--as approved` is a human-only act); this pr touches it only to pin it
- the guard reads judge stdout to build what a driver sees on `route.stone.set`. a stream move changes what reaches the driver for every approval halt, across acceptance snapshots this pr does not otherwise move
- A ships no harm: the bytes are those of origin/main

## .rework: clean

one `console.log` → `console.error` in `route.ts`, plus the snapshots that pin the approval halt's stream.

## .confidence: 80%, and why not higher

r001 (repo-rules, i003 nitpick.1) reads the rule as bound to the extracted render. the rule fits; the question is only whether this pr is the place to move a stream it did not set.

## .where

- `src/contract/cli/route.ts:1299`
- `src/domain.operations/route/guard/review/peer/asJudgeApprovalHaltLines.ts`

## .verdict

confirmed by the foreman: A. the stdout rule binds a human-read error before an exit; a judge's stdout is its protocol, since the guard parses `passed:` / `reason:` from it (`runStoneGuardJudges.ts:170`). the dream `one-render-of-the-approval-halt` keeps the word merge.
