# F190 — a re-raise of a repair the target holds is refuted by line, not re-repaired

- raised 2026-10-09, from i031 r011 nitpick.1 + nitpick.2: both say a `toMatchSnapshot` repair
  recorded at i010/i023 "does not appear in the target file"
- rework: clean — a dispute is withdrawn by one `--as conceded`; no code moves either way
- status: 🟡 **BEST-GUESSED — disputed, with the lines cited**
- confidence: **90%**

## .the fork, stated fairly

| option | the claim |
|---|---|
| **A — concede, and add the assertion again** | the reviewer is satisfied by any edit it can see |
| **B — dispute, cite the line** | the assertion is present; a second copy would be a duplicate `then` that pins no new byte |

## .taken, and why

**B.** the target holds both assertions today, verified by grep against the worktree:

- `blackbox/review.partition.acceptance.test.ts:178` —
  `expect(asRedactedOutput(res.stdout)).toMatchSnapshot('help');` inside `[case4]`
- `blackbox/driver.route.guard-partition.acceptance.test.ts:244` —
  `expect(result.stderr).toMatchSnapshot('refuse none mixed');` inside `[case2b][t1]`

and both files reached the prompt whole — the run's `tokens.expected.md` lists them at 2.8k and
7.6k tokens under targets, not as a diff hunk. so the tool sent the bytes; the brain took the older
givens in the conversation (where the point was first raised) over the target. a concession would
grade a non-defect `better` and commit to a fix that has no edit to make.

### the same class, at i031 r026 — three points the target already answers

| point | what the target holds |
|---|---|
| n1: `asWarmerValueLines` hand-rolls `them` / `it` beside a counted noun | no `them` in the file. `never inside it` names the net; `each settles once a review reads it` agrees with `each`. neither pronoun depends on a count |
| n2: `genReviewRunStdout [case8][t0]` pins `over 12 targets` with every target row at `0 chars` | the snapshot reads `over 3 targets (source: parsed)`, `targetFiles 70.0k` — census and locus agree (snap line 644, 650) |
| n3: grove `[case16]` pins a `+75.0pp` move over a `cache.get 0` corpus | the fixture's days are 0/1,000 and 300/400 (75%), the total 300/1,400 (21.4%) — the move is reachable, `cache.get` is 300, and `asReport` refuses the impossible shape (`[case16b]`) |

## .rework, and why

**clean.** to reverse: `--as conceded` on the two ordinals. no file changes either way.

## .confidence, and why it is not higher

- the grep is exact, but a reviewer may mean a *different* `then` than the one present (e.g. a
  snapshot of the full stdout rather than a redacted one). the cited lines snap the whole stream,
  so that sense seems unlikely
- a misread that recurs across rounds hints the conversation section outweighs the target for
  this lane; if it re-raises a third time, trim this lane's `--conversation` depth in the guard

## .where

`blackbox/review.partition.acceptance.test.ts` · `blackbox/driver.route.guard-partition.acceptance.test.ts`

## .verdict

(open)
