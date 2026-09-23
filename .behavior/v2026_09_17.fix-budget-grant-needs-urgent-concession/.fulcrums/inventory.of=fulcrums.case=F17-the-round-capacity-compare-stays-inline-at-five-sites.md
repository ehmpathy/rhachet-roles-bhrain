# F17 — the round-capacity compare stays inline at a fifth site

- **rework** = 🟢 **clean** — a pure extraction of arithmetic that is byte-identical at every site
- **triage** = 🔴 **wisher** — a scope call of `F13`'s shape: *does this repair belong to this behavior?*
- **confidence** = 🟡 **68%**
- **status** = best-guessed
- **where** = `computeBudgetGrantRefusal.ts:52-55` (the new site) · `runStoneGuardReviews.ts:884` ·
  `isReviewPeerSkippedForBudget.ts:57` · `getAllReviewPeerMeterStatuses.ts:179` ·
  `formatRouteGuardReviewPeerAbsorptionAck.ts:159-161`
- **opened at** = `r2` self-review, slug `has-consistent-mechanisms`, 2026-09-18

## .the fork

the consistency sweep asked, of `hasLaneRunDry`, *"does the codebase already hold one that does
this?"* — and found **no named one, and four unnamed ones.** this behavior made it five.

| | the fork |
|---|---|
| **A** — extract now | one `hasMeterRunDry({ rounds, budget })` in the meter directory; each of the five keeps its own conjunct at its own site |
| **B** — leave, catch it | the fifth site ships inline, a dream carries the shape of the fix, and a successor lands it |

## .taken — B, and why at the time

the SAFE/CLEAN test (`rule.always.fix-forward-under-scouts-honor`) splits:

- **safe?** ✅ **yes.** the arithmetic is identical at all five, and two already carry the guarded
  `!Number.isFinite` form. no behavior moves
- **clean?** 🔴 **no.** it opens three files this change never touched — `runStoneGuardReviews.ts`,
  `isReviewPeerSkippedForBudget.ts`, `getAllReviewPeerMeterStatuses.ts` — plus their tests. a
  budget-gate diff has no reason to reach the review runner

⇒ **a fix that fails CLEAN is deferred, and the deferral is a judgment about ripple cost** — which is
what this row exists to surface.

## .the case to overrule it

🔴 **`rule.prefer.wet-over-dry` puts the line at 3+ usages, and this is FIVE.** the extant state was
already past the rule of three before this behavior opened, so B ships a sixth precedent that says
*write it inline* to the next author who needs one.

⚠️ **and the ripple estimate is a guess, which is the whole reason this is a fulcrum.** three files
plus their tests is the estimate; a council with the diff in view may read it as one commit.

## .the case to uphold it

🟡 **the five ask THREE different questions**, and a naive shared predicate would take two extra
boolean inputs:

| the question | asked by | the extra conjunct |
|---|---|---|
| **capacity** | `computeBudgetGrantRefusal` · `…AbsorptionAck` | none |
| **skip-this-pass** | `isReviewPeerSkippedForBudget` | `!hasArtifactThisPass` |
| **exhausted-this-generation** | `getAllReviewPeerMeterStatuses` · `runStoneGuardReviews` | `!hasReviewForCurrentHash` |

🔴 **the two sites that carry a conjunct warn hardest against the conflation, in a comment.**
`getAllReviewPeerMeterStatuses.ts:170-179`, verbatim: *"do NOT relax this to a bare
`rounds >= budget` … it unlocks the level above it a full pass early."*

⇒ **the extraction that fits is the SMALL one** — the bare arithmetic alone, each conjunct left at
its own site. the dream carries that shape. so the design work is done either way; what is in
dispute is **when it lands.**

## .the confidence, and why it is 68%

the call is B, and it rests on one estimate: *three files plus tests is dirty.* that estimate was not
measured — no diff was drafted, no test run was scoped. ⇒ **it is a judgment about ripple cost with
no measurement behind it**, and this board has one worked case (`F12`, 50% → 78% → 85%) where a row
graded on an argument moved twenty points the moment it was graded on a measurement instead.

🟡 **the evidence that would settle it is cheap and was not run:** draft the extraction, run the four
touched suites, and count the diff. a row that names its own decisive evidence and does not run it
should not sit above 70%.

## .the verdict

_unruled._

## .see also

`.dream/v2026_09_18.fix.the-round-capacity-compare-is-inline-at-five-sites.md` — the work this row
defers, with the shape of the fix ·
`review/self/for.5.1.execution.from_vision._.r2.has-consistent-mechanisms.md` — the sweep that found
it · `rule.prefer.wet-over-dry` — the rule of three this is past ·
`getAllReviewPeerMeterStatuses.ts:170-179` — the 🔴 comment that bounds the extraction
