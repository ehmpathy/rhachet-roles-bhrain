# F5 — rounds i003 and i004 points held out of this fix route

## .the fork

round i003 raised points whose cure ripples past the stance key and the judge's tally. the ones
inside it were repaired this round (the shed folded into the `reason:` line; the shed narrowed to
counted lanes; the corpus read once in the judge; a dispute clamp; a firm case1 [t2]; a teardown via
`genTempDir`; a stale comment). these are held:

| reviewer | the point | held because |
|---|---|---|
| r10 #2 | the exhaustion gate's budget halt names `--add N` with `--peer` only for one exhausted lane, not per urgent lane | ✅ **cured at 5.3 (i003 r1).** the urgent mark carries its lanes ahead of the colon, `asUrgentConcessionSlugs` reads them, and `asBudgetHaltRemedyGroup` names one `--peer` command per urgent lane, one leaf each. case11 runs the l1 grant end to end. the dream retired |
| r7 #1 | the EACCES tests depend on the host to deny `mkdir /nonexistent/...` | a temp dir with its mode removed fails the same way under root, which CI may run as; no portable deny exists without a fake fs. the cases pass in CI and on this host; the snapshot is masked |
| r11 #2 | lift the verdict arithmetic out of the cli into a pure `computeReviewedVerdict` | the narrow and the single corpus read landed as composed pure folds; the full extraction re-shapes `judgeReviewed`'s every branch (overrule, bypass, latch) — a refactor past the fix |
| r11 #5 | the deflake and hygiene edits ride the fix commit | they are fixes in files this route touched (scouts honor); the PR body names each |
| r11 #6 | two total orders (`getLatestReviewFilesPerSlug`, `getLatestPeerGivensPerSlug`) | the two selectors read different shapes (file paths vs parsed givens); one shared comparator is a refactor of extant code. the malformed-row throw half was repaired (`MalfunctionError`) |
| i004 r11 #2, #3 | build the counted givens once, sum the total and shed over them, in a pure `computeReviewedTally` | the same extraction as i003 r11 #2. the shed ⊆ total holds today by the narrow `getAllGivensOnReviewFiles`, clamped at unit and at acceptance (case8); the one-read form re-shapes `getOneReviewTotalsFromFiles` and every branch of `judgeReviewed` |
| i004 r11 #5 | the shed does not check that a lane is exhausted | the guard runs the judge only once every lane is terminal; a dispute shed on any lane before this route, unchanged. a standalone judge on a live lane is a diagnostic read, and a `better` stance there sheds what the driver declared. to gate it on the meter adds a read of `peerStatuses` into the shed — a behavior change past the key |
| i004 r11 #7 | the budget gate's urgent warrant reads the un-narrowed corpus | the gate has no list of counted files; a top-up for an overruled lane buys naught (the reviewer said so). one definition of "counted lane" for both is the i004 r11 #2 extraction |

## .taken — hold, and dispute each one

none ships a harm this fix introduced; each is dirty for this diff or not a defect.

## .rework — clean

each is an independent change.

## .confidence — 75%, and why it is low

r10 #2 was the strongest, and a 5.3 reviewer held it a blocker; it is cured. the rest are
refactors or host limits a council may still weigh.

## .where

`src/domain.operations/route/guard/tree/formatBlockRemedyGroups.ts` · `genRouteGuardExhaustedReason.ts` ·
`src/contract/cli/route.ts` · `src/domain.operations/route/gitignore/*.test.ts`.

## .verdict

r10 #2 cured at 5.3; the rest held, open — for the council.
