# session scratch: cache fixes for route guards

## context

the journey acceptance test revealed bugs in how reviews and judges are cached.

## key insight from user

> shouldn't the freshness of the review depend only on the hash of the contents? i.e., no need to run the review again if the hash has not changed?

> judges may be expensive too. (e.g., robot judges); we should be able to hash their results too, as they should only look at the reviews. (i.e., if the hash of the review artifacts has not changed, then reuse it... approval is considered a review artifact too)

## correct cache model

### reviews
- cache by artifact hash
- same content = reuse prior review
- if hash changes (artifact updated), run fresh review

### judges
- cache by hash IF prior judge PASSED
- if prior judge failed for this hash, re-run (external state may have changed)
- `approved?`: approval marker is external state, so failed judges re-run until approval granted
- `reviewed?`: reads reviews which are hash-cached, so can cache by hash

### the relationship
```
artifact content → hash ABC
                      ↓
              reviews run (cached by hash ABC)
                      ↓
              judges run (cached by hash ABC if passed)
```

## completed fixes

1. `runStoneGuardReviews.ts`: cache by hash (not iteration)
   - reverted iteration filter
   - uses `priorArtifacts.reviews` for same hash

2. `runStoneGuardJudges.ts`: cache passed judges by hash
   - if prior judge PASSED for this hash, reuse it
   - if prior judge FAILED, re-run (external state may have changed)

## work completed ✓

1. ✓ `reviewed?` judge in `route.ts`:
   - updated to filter reviews by hash instead of iteration
   - added `--hash` cli argument to judge command
   - glob pattern: `$stone.guard.review.*.$hash.*.md`

2. ✓ updated guard files to pass `$hash`:
   - `3.blueprint.guard`: added `--hash $hash` to reviewed? judge
   - `5.execute.guard`: added `--hash $hash` to reviewed? judge
   - `route.guarded/5.implement.guard`: added `--hash $hash`
   - `route.reviewed/1.implement.guard`: added `--hash $hash`

3. ✓ journey test updated to simulate real workflow:
   - when you "fix" issues, test now modifies artifact content (not just external flag)
   - this changes the hash, which bypasses cache naturally
   - simulates real behavior: fix code → hash changes → fresh review

4. ✓ all 75 acceptance tests pass

5. ✓ brief on bdd journey tests written:
   - `.scratch/brief.journey-tests-reveal-cache-bugs.[lesson].md`

## additional refinement: reviewed? judge computes hash itself

user insight:
> why is --hash passed in as an input? hash should be figured out by the judge on its own

> it should just look at the current reviews (& approvals) and compute its input hash

> the contract should be that the judge returns stdout, and the driver writes that stdout to the correct .route/* location

### changes made

1. ✓ updated `judgeReviewed` in `route.ts` to compute hash itself:
   - removed `hash` parameter from input
   - judge now finds stone, computes hash from artifacts
   - looks for reviews that match computed hash

2. ✓ removed `--hash` from CLI help text

3. ✓ updated guard files to remove `--hash $hash`:
   - `3.blueprint.guard`
   - `5.execute.guard`
   - `route.guarded/5.implement.guard`
   - `route.reviewed/1.implement.guard`

4. ✓ all 75 acceptance tests pass

5. ✓ formalized criteria in `usecase.8` in `2.1.criteria.blackbox.md`:
   - separation of concerns: driver orchestrates, commands output
   - reviews/judges output to stdout, unaware of file locations
   - driver handles hash computation, file write, cache

6. ✓ brief written:
   - `.scratch/brief.separation-of-concerns.[lesson].md`

### the principles

```
reviews/judges: pure evaluators → output to stdout
driver: orchestrator → captures stdout, writes files, manages cache
```

```
each component hashes its inputs:
- reviews hash on artifacts
- judges hash on reviews + approvals
```

7. ✓ added `usecase.9` to criteria: hash computation principle
   - reviews: hash on artifacts (their input)
   - judges: hash on reviews + approvals (their input)
   - cascade: artifact change → fresh reviews → judge sees new input

8. ✓ updated brief with hash principle section

## clarification: artifact hash as proxy for judge inputs

user question:
> are the comments in the code clear about that hash relationship? and do we have separate compute hash operations for judges vs reviews?

### findings

1. **no separate hash operations** — only `computeStoneReviewInputHash` exists
2. **both reviews and judges use artifact hash** — same hash passed to both
3. **comments were unclear** — said "judge inputs = reviews + approval state" but used artifact hash

### why artifact hash works as proxy

the implementation achieves the principle "judges hash on reviews + approvals" via:
- artifact hash for cache lookup
- only passed judges are cached

this works because:
- reviews are deterministic given artifact hash → same hash = same reviews
- failed judges (no approval) are not cached → re-run sees new approval

### changes made

1. ✓ updated comments in `runStoneGuardJudges.ts` to clearly explain cache strategy
2. ✓ updated comments in `setStoneAsPassed.ts` to explain hash principle
3. ✓ updated brief with "implementation: artifact hash as proxy" section
