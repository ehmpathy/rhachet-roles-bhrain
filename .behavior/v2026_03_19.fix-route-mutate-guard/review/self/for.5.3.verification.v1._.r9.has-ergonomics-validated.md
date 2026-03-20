# self-review: has-ergonomics-validated (r9)

## question

on ninth review: validate input/output matches repros?

## context

no repros artifact exists for this fix. ergonomics were defined in the wish and blueprint. validation proceeds against those sources.

## wish requirements

**requirement 1**: allow writes to bound route at `.route/xyz/`
- implemented: guard checks `^${ROUTE_DIR}/\.route/` prefix
- verified: [case7] allows `.route/xyz/artifact.md`

**requirement 2**: block writes to `.route/xyz/.route/` metadata
- implemented: same prefix check catches nested `.route/`
- verified: [case8] blocks `.route/xyz/.route/passage.jsonl`

**requirement 3**: blocker files go to `$route/blocker/`
- implemented: both `getBlockedChallengeDecision.ts` and `stepRouteDrive.ts` updated
- verified: unit test assertions confirm path

## blueprint test cases

**[case7]**: artifact writes to bound route allowed
- input: Write to `.route/xyz/artifact.md`
- output: exit 0, no stderr

**[case8]**: metadata writes to bound route blocked
- input: Write to `.route/xyz/.route/passage.jsonl`
- output: exit 2, guidance in stderr

both match implementation exactly.

## conclusion

no repros to compare against, but wish and blueprint requirements are fully satisfied.
