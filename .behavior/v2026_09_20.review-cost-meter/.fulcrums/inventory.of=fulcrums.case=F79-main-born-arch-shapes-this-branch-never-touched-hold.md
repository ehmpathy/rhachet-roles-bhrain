# F79 — main-born arch shapes this branch never touched hold

- rework = **dirty** — each repair rewrites a file this branch never opened, and races main's own edits to it
- confidence = 🟡 **75%**
- raised.by = r026 enroll-impl-arch-defects (blocker.2, nitpick.1, nitpick.2, nitpick.3) and r027 enroll-impl-arch-defects-review-ops (nitpick.2), at i035

## .the fork

five concerns name shapes in files whose cited lines this branch did not write:

| concern | file | `git diff origin/main` on the cited lines |
|---|---|---|
| r026 b2 | `getStoneConcededLaneSlugs.ts` | no change |
| r026 b2 | `genRouteGuardExhaustedReason.ts` | main SPLIT the concession reason further (`…_BETTER`, `…_URGENT`); the extra exports are main's |
| r026 n1 | `getRouteGuardReviewPeerPathTaken.ts` | no change |
| r026 n2 | `RouteStoneGuardReviewArtifact.ts` `durationMs`, `ReviewByResult.ts` | no change on the field |
| r026 n3 | `RouteStoneGuard.ts` accessors | no change on the three accessors |
| r027 n2 | `getReviewTimeoutMs.ts` | no change |

| option | what it yields |
|---|---|
| concede | six refactors of main's code in a cost-meter branch, each a merge hazard against main's newer edits |
| dispute | the shapes stay as main holds them; this branch's diff stays on its subject |

## .taken — dispute

- the branch sits behind `origin/main`, so a since-main diff shows main's newer edits as this branch's
  reversions. the reviewers read those lines as authored here
- `rule.prefer.wickup-touched-prose` and `rule.prefer.scouts-honor` bound the fix-forward to lines a
  change already touches; a re-architecture of untouched files is the smuggled refactor they forbid
- each is a fair concern for main, and none ships a harm through this branch

## .why confidence is not higher

`RouteStoneGuard.ts` and `stepReview.ts` do carry this branch's edits elsewhere in the file, so a
reader may hold that a touched file is in reach. the cited lines were not.

## .verdict

🟡 BEST-GUESSED 2026-10-01 — dispute.
