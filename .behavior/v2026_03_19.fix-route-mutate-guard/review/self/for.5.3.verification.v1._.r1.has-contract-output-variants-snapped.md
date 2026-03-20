# self-review: has-contract-output-variants-snapped (r1)

## question

does each public contract have snapshots for all output variants?

## examination

### contracts modified in this behavior

| contract | type | description |
|----------|------|-------------|
| route.mutate.guard | CLI hook | guard that blocks/allows route mutations |
| getBlockedChallengeDecision | SDK method | computes blocker articulation path |

### route.mutate.guard snapshot coverage

the guard has snapshot tests in `route.mutate.guard.integration.test.ts`:

| variant | snapped? | evidence |
|---------|----------|----------|
| allowed (exit 0) | yes | `expect(res.stderr).toMatchSnapshot()` in [case7] t0, t1 |
| blocked (exit 2) | yes | `expect(res.stderr).toMatchSnapshot()` in [case7] t2, t3 |
| new .route/xyz cases | yes | [case7] and [case8] with snapshots |

### acceptance test snapshots

in `driver.route.mutate.acceptance.test.ts`:

| variant | snapped? | evidence |
|---------|----------|----------|
| guard allows | yes | `expect(res.stderr).toMatchSnapshot()` in [case7] t0 |
| guard blocks | yes | `expect(res.stderr).toMatchSnapshot()` in [case7] t1 |

### getBlockedChallengeDecision coverage

this is an internal SDK method, not a public contract. its output (blocker path) is covered by:
- unit test assertions on path structure
- acceptance test snapshots of the full blocker flow

## conclusion

all public contracts have snapshot coverage for output variants. the guard captures allowed/blocked states with stderr snapshots.
