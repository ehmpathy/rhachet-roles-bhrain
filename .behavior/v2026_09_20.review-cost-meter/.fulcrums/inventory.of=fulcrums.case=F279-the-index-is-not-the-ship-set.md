# F279 — the index is not the ship set

- raised 2026-10-12, by `enroll-verif-snapshot-coverage` (blocker.1, blocker.2), at 5.3 i006
- rework: **clean** — a `git add` at commit time, which the commit tool already does
- status: 🟡 **BEST-GUESSED — disputed; the concern grades a state the route has not asked for**
- confidence: **88%**

## .the fork, stated fairly

the lane read `git status`, found the new endpoints staged and ~14 of their imports (and the
`review.partition` snapshot) untracked, and judged that *"the index as staged"* would not build.

| option | the claim |
|---|---|
| **A — dispute both** | the ship set is the worktree. no commit is asked for yet; when one is, `git.commit.set --unstaged include` stages every file first. the partial index is an artifact of an earlier pass, not what ships |
| **B — stage the untracked files now** | the index would then match the tree, and the lane would read a whole set |

## .taken, and why

**A.** B is not permitted: `rhx git.commit.uses get` reports no quota, so stage is unpermitted, and
`rule.forbid.commits-the-route-did-not-ask-for` holds the index still until a stone asks. the
worktree builds (`npm run build` ✓), the snapshot exists on disk, and every suite that reads it
passes (`review.partition` 25/0). the harm the lane names — *"commit the index as staged"* — needs
an act that is forbidden here.

the cause was the guard prose, which never said what the ship set is. the l3 prompt now says it:
the change set is the worktree, staged and untracked alike.

## .rework, and why

**clean.** at commit time the tool stages every file. naught here ripples.

## .confidence, and why it is not higher

a human could choose to commit only the index, which would ship a broken build. that choice is
theirs, and the commit stone is where it gets made.

## .where

`git status` of the worktree; `5.3.verification.guard` l3 prose

## .verdict

— (awaits the council)
