# F17 — one ENOENT allowlist is written three ways

- **raised** = 2026-09-20, i009, lane `enroll-impl-arch-defects` (nitpick #1), **re-scoped by the drive**
- **rework** = clean
- **status** = OPEN — deferred this round, with a dream
- **confidence** = 80%

## .the fork, stated fairly

the reviewer's nitpick: the ENOENT allowlist is hand-written at many sites; each copy is a place
`rule.forbid.failhide` can be broken by a dropped `throw`. consolidate it.

**the fork is not whether to consolidate — it is WHEN, and at what grain:**

| option | the claim |
|---|---|
| **A** — consolidate now, in this round | the reviewer is right, the pattern is mechanical, and a fix deferred is a fix re-derived later at full price (`rule.always.fix-forward-under-scouts-honor`) |
| **B** — consolidate the three sites this round touched, leave the rest | scouts honor's literal bound: repair what you touched |
| ✅ **C** — defer the whole consolidation, with a dream | the ripple crosses a repo-wide vocabulary verdict this stone has no warrant to make |

## .taken, and why AT THE TIME

**C.** and the reason is a count rather than a feel, which is the part that matters:

- **24 touch points, 9 directories** — `isENOENT` ×6, `getFsErrorCode` ×5, inline ×~13. two of the
  directories (`learn/`, `telepath/`) this round has never opened and neither is downstream of the
  self-review gate
- 🔴 **the repo already holds TWO rival operations for the one concept** — `isENOENT` at
  `route/guard/` and `getFsErrorCode` at the `domain.operations` root. that is a
  `rule.forbid.domain-term-inconsistency` violation that **predates this round**, and it is the
  cause of the ~13 inline copies rather than a separate defect
- ⇒ **so any consolidation must first settle which word wins**, which is a `domain.terms` decision.
  to make it inside an execution stone would settle a repo-wide vocabulary question as a side effect
  of a self-review repair
- the per-site outcomes differ — `return false`, `return null`, a bare `return`, a rethrow — so the
  sweep is **24 judgments, not 24 substitutions**

**B was refused as an illusion of progress**: the three sites this round touched already carry the
explicit allowlist with the rethrow and a stated reason. there is naught to repair at them — the
defect is the *absence of one canonical form*, which a three-site change does not address and does
make harder to see.

## .rework, and why

**clean.** the combinator absorbs all three forms and all four outcomes, so a later consolidation is
a substitution per site rather than a teardown. no caller hardens against the current shape, and no
later work in this round builds on it.

## .confidence, and why it is not higher — 80%

the **count** is measured, so the CLEAN verdict is not a guess. what is not certain is the **shape**:
the dream proposes a combinator (`asAbsentOr<T>`) on the argument that the per-caller outcome is what
varies, and that argument rests on a read of the 24 sites rather than on a design anyone has ruled. a
council that prefers a predicate plus explicit branches at each call site would hold a defensible
position this fulcrum has not refuted.

🟡 and 80% rather than 93% for a second reason: **this round has had two deferral estimates falsified
by measurement**, both high. the count here was taken *because* of that history — but a count of
touch points is not a count of *effort*, and the round's own record says the drive is systematically
pessimistic about ripple.

## .where

- the dream: `.dream/v2026_09_20.fix.one-enoent-allowlist-is-spelled-three-ways.md`
- the two rival operations: `src/domain.operations/route/guard/isENOENT.ts` ·
  `src/domain.operations/getFsErrorCode.ts`
- the three sites this round touched: `getSelfReviewChallengeDecision.ts:140` ·
  `getSelfReviewTriggeredReport.ts:47` · `setSelfReviewTriggeredReport.ts:67`

## .the verdict, once ruled

— not yet ruled.
