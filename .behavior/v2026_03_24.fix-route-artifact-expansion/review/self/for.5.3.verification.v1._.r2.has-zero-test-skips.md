# self-review: has-zero-test-skips

## the question

did you verify zero skips?
- no .skip() or .only() found?
- no silent credential bypasses?
- no prior failures carried forward?

## search results

searched for `.skip(` and `.only(` across all test files.

found 7 files with skips — all in thinker skills:
- `src/domain.roles/thinker/skills/khue.triage/stepTriage.integration.test.ts`
- `src/domain.roles/thinker/skills/khue.instantiate/stepInstantiate.integration.test.ts`
- `src/domain.roles/thinker/skills/khue.diverge/stepDiverge.integration.test.ts`
- `src/domain.roles/thinker/skills/khue.cluster/stepCluster.integration.test.ts`
- `src/domain.roles/thinker/skills/brief.demonstrate/stepDemonstrate.integration.test.ts`
- `src/domain.roles/thinker/.scratch/zoomout/stepZoomout.integration.test.ts`
- `src/domain.roles/thinker/.scratch/primitive.idealogic.composite/expand/stepExpand.integration.test.ts`

## analysis

these skips are:
1. **not in changed files** — `git diff main --name-only` shows no thinker files modified
2. **unrelated to this PR** — this PR fixes route artifact expansion, not thinker skills
3. **extant prior to this PR** — these skips were present before this PR started

the route-related test files have zero skips:
- `blackbox/driver.route.*.acceptance.test.ts` — no skips
- `src/domain.operations/route/**/*.test.ts` — no skips
- `src/domain.operations/route/**/*.integration.test.ts` — no skips

## conclusion

no skips introduced by this PR. all route tests run without skip or only.

extant skips in unrelated thinker code are out of scope for this behavior fix.
