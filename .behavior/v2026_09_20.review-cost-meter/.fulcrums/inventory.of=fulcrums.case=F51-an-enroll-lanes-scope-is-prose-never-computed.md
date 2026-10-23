# F51 — an enroll lane's scope is prompt prose, never the scope the engine computes

## .the fork

round i003, lane `enroll-impl-behavior-intent` found most of the feature outside the scope its
prompt named: `git diff origin/main --name-only` omits untracked files, and this feature is mostly
untracked. an `rhx review` lane cannot make that mistake — `--diffs since-main` unions untracked
files in `getAllFileDiffsFromRange`. an enroll lane has no computed scope; its author re-derives one.

- **A** — patch the two prompts to name diff ∪ `git ls-files --others --exclude-standard`; defer the
  class to a dream
- **B** — build it now: the guard computes the target list with the engine's own functions, writes it
  per round, and hands enroll lanes a `$targets` runtime var

## .taken, and why at the time

**A.** B adds a runtime guard var (`RUNTIME_GUARD_VAR_NAMES`, the upgrade scan, the review-run
substitution) and a per-round artifact — a guard-surface contract this wish never opened, raised
mid-review. A repairs the instance at once; the dream carries the shape of B.

## .rework

🔴 **dirty** — B touches the guard runtime contract here and every enroll prompt bhuild stamps.

## .confidence, and why it is low

🟡 **80%.** the patched prose is correct today and drifts the next time a prompt is authored; a
reviewer that re-raises scope will say so.

## .where

- `.behavior/v2026_09_20.review-cost-meter/5.1.execution.from_vision.guard` — both enroll prompts
- `.dream/v2026_09_26.fix.enroll-lanes-take-the-computed-review-scope.md`
- `.dream/v2026_09_26.reseed.bhuild-guard-templates-use-the-reviewers-as-bhrain-now-does.md` item 3

## .verdict

**overruled 2026-09-26 → B, built this round** (seed S23). the motive that tipped it is cost: a
low-budget review must be easy for every guard author, and a scope each prompt re-derives is not.
enroll lanes stay enroll lanes; they read the list the engine computes.

- `$targets` in `RUNTIME_GUARD_VAR_NAMES`; `setStoneGuardReviewTargets` writes
  `…given.by_peer.<slug>.targets.txt` per lane, only when the command names `$targets`
- clamps: `setStoneGuardReviewTargets.integration.test.ts` (untracked in, deleted out) and
  `runStoneGuardReviews.integration.test.ts [case32]` (substituted, untracked listed, still one given)
- both enroll prompts in `5.1.execution.from_vision.guard` now read `$targets`
- the dream it deferred is retired; bhuild's reseed item 3 now points at the shipped var
