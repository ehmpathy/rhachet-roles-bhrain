# domain.term.choice.reason: tallier

## .etymology
**tallier** = the agent that tallies. the concept is "which role produced the count", so the
contract field is named for the ROLE (noun-agent form: tally → tallier), which also matches the
render vocabulary `tallied by reviewer@$brain`. chosen over `counter` (overloaded — a counter is
also a cumulative total), `method` (buzzword-vague), and `decider` (the field records who
tallied, not who decided a verdict).

## .the two-layer distinction: `tactic` (internal) vs `tallier` (contract)
one concept is named at two layers on purpose:

| layer | word | where | why |
|-------|------|-------|-----|
| internal compute | `tactic` | `getReviewCounts` waterfall (`getReviewCounts.ts:27,38`) | the orchestrator's word for the approach it chose — the regex tactic, else the sub-brain tactic |
| published contract | `tallier` | `RouteStoneGuardReviewArtifact.ts:60` + render | the role that produced the tally; matches `tallied by reviewer@$brain` |

the boundary cast is explicit and repeated across the guard: `tallier: tactic`
(`getAllStoneGuardArtifactsByHash.ts:168`, `getLatestReviewArtifactForIndex.ts:113`,
`runOneReview.ts:195`). the domain object documents the intent verbatim
(`RouteStoneGuardReviewArtifact.ts:54-56`): "internally the orchestrator calls this the `tactic`
it chose; on this persisted contract the field is named for the ROLE that produced the tally
(`tallier`)."

so `tactic` is NOT a forbidden synonym of `tallier` — it is the deliberate internal twin. the two
enum shapes coincide (`'deterministic' | 'probabilistic'`) because they name the same base fact
from two vantage points: internal approach vs published role.

## .disputes
### dispute: unify tactic/tallier — raised 2026-07-29 — status: RESOLVED (keep the two-layer distinction)
- raised.by  = learner peer review (term-application rubric, rule.forbid.domain-term-inconsistency),
               on the review.by disintermediation wish (v2026_06_07.skill-review-by, stone 5.5.playtest)
- claim      = `tactic` and `tallier` carry the same enum values, so they are one concept under
               two words — a forbidden inconsistency; pick one canonical word.
- counter    = the split is an extant, documented, deliberate internal↔contract layer distinction
               (`RouteStoneGuardReviewArtifact.ts:54-56`), applied at three committed cast points.
               `rule.forbid.domain-term-inconsistency` excepts "a distinction concealed under a
               shared shape" and permits "leave them until disturbed (no forced mass-rewrite)."
               the disintermediation wish did not disturb the two words; the new code conformed to
               the declared contract word `tallier` and read the declared internal word `tactic`.
- resolution = keep the two-layer distinction; itemize `tallier` (contract) with `tactic` recorded
               as its deliberate internal twin (not a forbidden synonym). a future wish MAY unify
               to one word as a clean rename with no behavior change — deferred, not owed here. the
               learner peer approved this articulation on the second round (0 blockers, 0 nitpicks).

## .evidence
- discovery: the term already composed declared contracts (RouteStoneGuardReviewArtifact,
  ReviewVerdict, the guard tree render) before this glossary named it; the dispute above forced
  the choice into the open and settled it.
- invariants: `tallier` is `null` if and only if the review carries no detected verdict (a
  malfunction) — a detected verdict always names its tallier; the boundary cast holds this
  (`counts.detected ? counts.tactic : null`).
