# domain.term.choice.reason: clearance

## .etymology
a peer-review level is a checkpoint; the word for "this checkpoint lets you through" is
**clearance** (as in security clearance — permission to proceed, granted against a bar).
the domain already said a level is *clear-for-passage* or *clear-for-unlock*; `clearance`
is the noun that names the object that holds both those bits at once, so a single op can be
the source of truth.

chosen over:
- `readiness` — overloaded with `ready` (an extant NON-terminal verdict: a level unlocked
  but not yet run); `clearance` avoids a collision with that state word
- `eligibility` — legalistic, and hides that there are TWO distinct bars (unlock vs passage)
- `greenlight` / `pass-state` — informal / ambiguous; neither carries the two-bar structure

`clearance` keeps the extant adjective phrases `clear-for-unlock` / `clear-for-passage`
intact as its two fields, so no established term is displaced — the noun simply gathers them.

## .disputes
### dispute: clearance vs clear-for-passage  —  raised 2026-07-24  —  status: RESOLVED (both kept, distinct scopes)
- raised.by  = learner (prior rounds flagged the risk)
- claim      = `clearance` might duplicate the extant `clear-for-passage` concept
- counter    = `clear-for-passage` is ONE boolean bar; `clearance` is the per-level RECORD
               that holds BOTH bars (`clearForUnlock` + `clearForPassage`) plus `overruled`
               / `hasQueued`. distinct grains: a bit vs the record that carries it.
- resolution = keep both. `clearance` names the record (the `getStoneGuardLevelClearance`
               return); `clear-for-passage` remains the name of one bit within it.

## .evidence
- discovery: the Path B single-source refactor — the per-level clearance was re-derived in
  ~6 sites (`judgeReviewed`, `getReviewPeerLadderStatus`, meter awaits, two `levelByReviewIndex`
  maps). a new `getStoneGuardLevelClearance` op (with a 9-case unit test) collapsed them onto
  one primitive, the exact `rule.require.single-source-of-truth-for-render` motive.
- invariant: `clearForUnlock` (terminal-for-unlock: approved | overruled | exhausted |
  malfunction | constraint) is STRICTLY WEAKER than `clearForPassage` (approved on merit, or
  overruled). every clear-for-passage level is clear-for-unlock; the converse fails — the
  distinction the whole behavior protects.
