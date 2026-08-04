# domain.term: clearance

term.chosen   = clearance
term.kind     = noun                 # noun | verb | adj — reused across objects & operations
term.synonyms.forbidden:
- readiness
- eligibility
- pass-state
- greenlight

## .what
the per-level verdict on whether a peer-review level has cleared its two distinct bars:
`clearForUnlock` (may the next level run?) and `clearForPassage` (may the stone pass?).
clearance is the SINGLE source of truth that answers both — extracted so the ladder's
unlock logic and the passage judge read one derivation, never two that can drift.

`clearForUnlock ≠ clearForPassage` is the crux the `fix-route-overruled` behavior turns on:
a level terminal-for-unlock (overruled / exhausted / malfunction / constraint) unlocks the
next level yet is NOT clear-for-passage (approval-only). clearance holds both, distinctly.

## .refs
where the term is declared / used, plus notable examples:
- src/domain.operations/route/guard/review/peer/meter/getStoneGuardLevelClearance.ts  # the single-source op
- src/domain.operations/route/guard/review/peer/meter/isReviewLevelUnlocked.ts         # reads clearForUnlock of lower levels
- src/domain.operations/route/guard/review/runStoneGuardReviews.ts                     # gates a level's run on clearance
- src/contract/cli/route.ts                                                            # judgeReviewed reads clearance

## .reason
see the ref-level cluster beside this choice:
- `term=clearance._.choice.reason.md` — etymology, disputes, evidence
