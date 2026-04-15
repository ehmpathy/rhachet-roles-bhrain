# self-review: has-contract-output-variants-snapped (r5)

## the claim

each public contract has EXHAUSTIVE snapshots for all output variants.

## gaps found

case3, case4, case7, case8, case9 (both when blocks), and case10 were **not snapped**.

these are error cases that output to stderr. the guide says:
> "**zero gaps in caller experience.** every contract must snap every output variant."

## the fix

added `then('stderr matches snapshot', ...)` assertions to:
- case3: collision detection (stone already exists)
- case4: invalid stone name
- case7: empty stdin
- case8: template not found
- case9 [t0]: no --stone arg
- case9 [t1]: no --from arg
- case10: route not found

## proof

```sh
$ rhx git.repo.test --what acceptance --scope driver.route.stone.add --resnap
🎉 passed (93s)
├─ suites: 1 files
├─ tests: 50 passed, 0 failed, 0 skipped
└─ time: 93s
```

## verification: snapshot count

before fix: 4 snapshots (case1, case2, case5, case6 stdout only)
after fix: 4 + 8 = 12 snapshots (all success + all error stderr)

| case | variant | snapped? |
|------|---------|----------|
| case1 | stdout (plan mode) | **yes** |
| case2 | stdout (apply mode) | **yes** |
| case3 | stderr (collision) | **yes** (fixed) |
| case4 | stderr (invalid name) | **yes** (fixed) |
| case5 | stdout (template) | **yes** |
| case6 | stdout (stdin) | **yes** |
| case7 | stderr (empty stdin) | **yes** (fixed) |
| case8 | stderr (template 404) | **yes** (fixed) |
| case9[t0] | stderr (no --stone) | **yes** (fixed) |
| case9[t1] | stderr (no --from) | **yes** (fixed) |
| case10 | stderr (route 404) | **yes** (fixed) |

## the result

- all 11 output variants now have snapshots
- error messages are vibecheck-able in PRs
- zero gaps in caller experience
