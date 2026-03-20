# self-review: has-contract-output-variants-snapped (r2)

## question

on second review: are all output variants truly captured?

## deeper examination

### route.mutate.guard output variants

the guard produces different output for:

| scenario | exit code | output content | snapped? |
|----------|-----------|----------------|----------|
| write allowed to bound route | 0 | "allowed" message | yes |
| write blocked to .route/ metadata | 2 | "blocked" message with guidance | yes |
| bash blocked with .route/ path | 2 | "blocked" message | yes |
| stone/guard read blocked | 2 | "blocked" message | yes (extant tests) |
| no bound route (all allowed) | 0 | silent or minimal | yes (extant tests) |

### new test cases added for .route/xyz scenarios

| test | variants captured |
|------|-------------------|
| [case7] t0 | allowed artifact write |
| [case7] t1 | allowed nested artifact |
| [case7] t2 | blocked metadata write |
| [case7] t3 | blocked bash to metadata |
| [case8] t0-t3 | similar variants |

### snapshot update summary

8 new snapshots were added/updated to capture the new `.route/xyz/` route scenarios. each captures stderr output for vibecheck in PRs.

## conclusion

all output variants for the modified contract are captured in snapshots. reviewers can vibecheck guard output in PR diffs.
