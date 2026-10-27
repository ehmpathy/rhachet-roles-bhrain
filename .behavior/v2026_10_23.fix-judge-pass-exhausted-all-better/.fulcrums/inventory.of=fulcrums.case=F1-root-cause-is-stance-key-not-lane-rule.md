# F1 — the root cause is the stance key, not an absent lane rule

## .the fork

- **A (taken)** — cure the stance↔given key: compare by the given's filename, write route-relative.
  the per-concern `better` shed already in the judge then sees every stance
- **B** — add the lane-grain rule the wish words: an exhausted lane with every concern absorbed and
  all-`better` stops to count

## .taken, and why

A. the per-concern shed already ships (`route.ts:1587-1604`) and passes the canonical flow. the
measured halt reproduces byte for byte only when the route's absolute path differs from the one the
stances were written under. B would sit beside a sound rule, and a lane-grain shed sheds
concerns the driver never named (`rule.forbid.suppression-of-undeclared-concerns`). B also would not
fix the urgent read, which lapses under the same key.

## .rework

clean. B, if the wisher wants it on top, is an additive guard in `judgeReviewed` that ripples to no
caller.

## .confidence — 65%, and why not higher

the mechanism is reproduced byte for byte: a judge that builds a different absolute path than the
set side reads `3 > 0` on a stone the gate calls clean. the trigger in the clamp tree is not
observed — the tree is gone. a wholly moved route does NOT produce the symptom (the entrance gate
catches it first), so the tree needed its driver process and its judge subprocess to disagree,
and which divergence did that (`cwd: repoRoot` vs the driver's cwd, a relative vs absolute
`$route`) is unprobed. an alternate cause A does not cover: a further defect this repro did not hit.

what lifts it: A makes every pair of readers agree regardless of which divergence occurred, so the
cure covers the whole class; and 5.1 probes the subprocess divergence directly before it builds.

## .the 5.1 probe — what the divergence is

measured in the clamp (`blackbox/driver.route.exhausted-all-better.acceptance.test.ts`): the set
side wrote `/tmp/test-fns/…/.reviews/peer/…` — the REALPATH — while the test holds the temp dir
under the repo's `.temp`, itself a symlink to `/tmp/test-fns`. `process.cwd()` resolves symlinks;
a `$route` handed down as given does not. so a route reached through any symlinked dir (a
worktree root, a home on a symlinked volume) keys the stance to one path and lets a judge build
another. this is the likely trigger in the clamp tree; it is observed here, not there.

a legacy ledger rewritten with the unresolved path read `3 > 0` even at the same route — the same
mismatch, from the other side. after the cure both forms pass. confidence in A: 85%.

## .where

`getLiveReviewAbsorptions.ts`, `computeUndeclaredConcernLabels`, `getAbsorptionOnConcern`,
`setStoneAsConcernAbsorbed.ts`

## .verdict

open — for the council.
