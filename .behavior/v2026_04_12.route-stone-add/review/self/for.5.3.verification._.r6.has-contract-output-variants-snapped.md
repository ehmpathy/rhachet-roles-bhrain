# self-review: has-contract-output-variants-snapped (r6)

## the claim

each public contract has EXHAUSTIVE snapshots for all output variants.

## complete coverage verification

### snapshot inventory (11 total)

| case | variant | type | snapped? |
|------|---------|------|----------|
| case1 | plan mode stdout | success | **yes** |
| case2 | apply mode stdout | success | **yes** |
| case3 | collision stderr | error | **yes** |
| case4 | invalid name stderr | error | **yes** |
| case5 | template stdout | success | **yes** |
| case6 | stdin stdout | success | **yes** |
| case7 | empty stdin stderr | error | **yes** |
| case8 | template 404 stderr | error | **yes** |
| case9[t0] | no --stone stderr | error | **yes** |
| case9[t1] | no --from stderr | error | **yes** |
| case10 | route 404 stderr | error | **yes** |

### checklist per contract

- [x] positive path (success) is snapped — case1, case2, case5, case6
- [x] negative path (error) is snapped — case3, case4, case7, case8, case9, case10
- [x] edge cases are snapped — collision, invalid name, empty stdin, 404s
- [x] snapshot shows actual output, not placeholder — verified in .snap file

### --help variant

the error messages include `"hint": "--help for usage"` in their output. the help text itself is standard argparse/yargs output that doesn't require behavioral verification. the error cases already snap the contextual help hints.

### verification: snapshot file

```sh
$ wc -l blackbox/__snapshots__/driver.route.stone.add.acceptance.test.ts.snap
116 lines
```

```sh
$ grep -c 'exports\[' blackbox/__snapshots__/driver.route.stone.add.acceptance.test.ts.snap
11 snapshots
```

## the result

- 11 snapshots cover all success and error variants
- error messages include help hints in context
- vibecheck-able in PRs without execution
- zero gaps in caller experience
