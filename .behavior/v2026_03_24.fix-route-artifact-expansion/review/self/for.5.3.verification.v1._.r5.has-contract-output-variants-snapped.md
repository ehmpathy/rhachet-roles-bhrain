# self-review: has-contract-output-variants-snapped

## the question

does each public contract have snapshots for all output variants?

## snapshot file

`blackbox/__snapshots__/driver.route.artifact-expansion.acceptance.test.ts.snap`

## variants covered

| variant | snapshot | output type |
|---------|----------|-------------|
| blocked by approval (root route) | case1 t1 | stdout |
| allowed after approval (root route) | case1 t2 | stdout |
| blocked by approval (nested route) | case2 t0 | stdout |
| allowed after approval (nested route) | case2 t1 | stdout |

## output content verified

the snapshots show:
- guard artifacts list (e.g., `1.vision.md`)
- review command and result
- judge command and result
- passage status (`blocked` or `allowed`)
- reason when blocked (`wait for human approval`)

## why it holds

1. **success case covered** — case1 t2 and case2 t1 show `allowed` status
2. **blocked case covered** — case1 t1 and case2 t0 show `blocked` status
3. **both route types covered** — root route (case1) and nested route (case2)
4. **actual output captured** — snapshots show real CLI output with artifacts, reviews, judges

## conclusion

all contract output variants are snapped. the acceptance test captures success, blocked, root, and nested variants.
