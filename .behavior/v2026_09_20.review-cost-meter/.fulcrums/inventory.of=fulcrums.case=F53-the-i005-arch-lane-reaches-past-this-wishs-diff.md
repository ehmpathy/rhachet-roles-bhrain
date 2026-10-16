# fulcrum F53 — the i005 arch lane reaches past this wish's diff

- rework = 🟡 **mixed** — clean per concern where built; 🔴 **dirty** for each deferral below
- status = 🟡 **BEST-GUESSED 2026-09-26 — repair what the wish authored; defer, with a dream, what it
  merely sits beside; dispute what is not a defect**
- confidence = 🟡 **78%**
- raised.by = peer lane `enroll-impl-arch-defects`, i005 r012 (4 blockers, 15 nitpicks)

## .the fork

the lane read ~150 files, and a large share of its concerns sit in files this wish did not author:
extant on main, or touched by one line. three ways to meet a lane like that:

| option | cost |
|---|---|
| **A** — repair every concern here | a CLI-wide flag rework, a guard-helper lift, and a lock-shape change ride along under a cost-meter wish. 🔴 the smuggled refactor `rule.prefer.scouts-honor` bounds |
| **B** — repair what this wish authored, plus any extant fix that is small, safe, and clean; defer the rest with a dream per gap (taken) | each deferral is a judgment — hence this row |
| **C** — dispute every extant-on-main concern wholesale | 🔴 a declaration at FILE grain, which `rule.forbid.suppression-of-undeclared-concerns` forbids. each concern is answered by name below |

## .per concern — the grain the absorb gate counts

| concern | disposition | why |
|---|---|---|
| blocker.1 — `genReviewRunStdout` inline IIFEs | ✅ **repaired** | branch-authored. seven named transformers |
| blocker.2 — post-spawn write orphans a warmer | ✅ **repaired** | branch-authored. `setReviewWarmerHandoff` kills the child before a rethrow |
| blocker.3 — `review.by.ts` refusal headers | ✅ **repaired** | extant on main, but three strings and three snapshots: safe and clean. exit stays 1 — `review.by`'s exit 2 is a verdict |
| blocker.4 — `reflect.ts` flag rigor | 🟡 **disputed → `F14`** | extant on main; this branch changed 8 lines (a brain pin). the gap is already `F14`'s dream, move 2, which names `reflect.ts:114` — the fix changes what a shipped command does with a malformed call |
| nitpick.1 — dup token fold | ✅ **repaired** | `sumReviewTokens` at `review/`, read by meter and grove |
| nitpick.2 — `SLUG_OF_ABSENT_IDENTITY` home | ✅ **repaired** | lifted to `review/` |
| nitpick.3 — "multi-export" `asFigureHuman`, meter/grove reports | 🟡 **disputed** | each exports ONE operation beside its own constants and types (`MARK_OF_ABSENT`, `LABEL_OF_ABSENT_KEY`, report interfaces). the rule counts operations |
| nitpick.4 — dup plan-match boolean | ✅ **repaired** | `isWarmerPlanMatch`, read at both sites |
| nitpick.5 — two lock reads per decision | 🟡 **conceded `better`, deferred** | dream `the-warmer-lock-is-read-twice-…`. the fix changes `isReviewWarmerAlive`'s signature |
| nitpick.6 — bare-ms claim window | 🟡 **conceded `better`, deferred** | same dream. the fix changes the lock's stored shape, which a live warmer from an older build still writes |
| nitpick.7 — read+parse dup, two files | 🟡 **disputed** | two instances. `rule.prefer.wet-over-dry`: wait for the third |
| nitpick.8 — `asReviewWarmerLock` / `…Paths` 4 ops each | 🟡 **conceded `better`, deferred** | the `F49` dream's residue, appended there |
| nitpick.9 — `runReviewWarmer` verb | 🟡 **conceded `better`, deferred** | same dream. the rename moves the detached process's spawn entry |
| nitpick.10 — `set*` writer boilerplate | 🟡 **conceded `better`, deferred** | the `stepreview-writes-six-artifacts` dream, appended there — the same unshared write |
| nitpick.11 — `stepReview` token total | 🟡 **disputed** | on main since #50. a four-term sum of named fields reads plainly; no decode owed |
| nitpick.12 — `TokenBreakdownEntry` twice | ✅ **repaired** | the local copy is gone; the exported type is read |
| nitpick.13 — `validateNoNpx`/`substituteVars` dup | 🟡 **disputed** | on main since #248. this branch added one passthrough line inside the judge's copy. the lift reaches both guard runners |
| nitpick.14 — `reflect.ts` bundles 7 ops | 🟡 **disputed** | on main since #196, untouched here but for a brain pin |
| nitpick.15 — `isNodeEvalMode` ×3 | 🟡 **disputed** | on main since #62; this branch touched none of the three |

## 🟡 .why 78%

- a council may prefer the extant-on-main disputes as **concessions with dreams** instead — the
  gaps are real; the dispute is only that this wish is the wrong vehicle. the rework either way is a
  relabel, never code
- nitpick.13 is the closest call: the branch did edit inside the duplicated helper, so "untouched"
  is not quite true. one line of a passthrough is the whole contact

## .where

- `src/domain.operations/review/meter/genReviewRunStdout.ts`, `warmer/genReviewWarmer.ts`,
  `sumReviewTokens.ts`, `SLUG_OF_ABSENT_IDENTITY.ts`, `warmer/isWarmerPlanMatch.ts`,
  `getAllTopDirsByTokens.ts`, `src/contract/cli/review.by.ts`
- the dreams: `.dream/v2026_09_26.fix.the-warmer-lock-is-read-twice-and-its-claim-window-is-bare-ms.md`
  · `.dream/v2026_09_26.fix.review-ops-one-per-file-and-sanctioned-verbs.md`
  · `.dream/v2026_09_25.fix.stepreview-writes-six-artifacts-inline-beside-its-own-communicator.md`
  · `.dream/v2026_09_22.fix.three-cli-flag-parsers-and-only-the-newest-refuses-a-valueless-flag.md`
