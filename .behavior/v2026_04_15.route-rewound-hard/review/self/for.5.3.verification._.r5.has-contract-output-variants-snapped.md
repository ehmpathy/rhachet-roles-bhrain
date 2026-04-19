# self-review: has-contract-output-variants-snapped

## the contract

`route.stone.set --as rewound --yield [drop|keep]`

cli command that rewinds a stone with yield file archive option.

## required variants

| variant type | what | snapped? |
|-------------|------|----------|
| success + yield drop | `--as rewound --yield drop` | yes |
| success + yield keep | `--as rewound --yield keep` | yes |
| success + cascade drop | multiple stones with yield drop | yes |
| error variants | flag conflicts | no snapshot (error messages only) |

## snapshot files reviewed

### driver.route.set.yield.acceptance.test.ts.snap

contains 3 snapshots:

1. **case1: yield drop** - shows `yield = archived` in output
2. **case2: yield keep** - shows `yield = preserved` in output
3. **case6: cascade drop** - shows `yield = archived` for cascade stones

### driver.route.set.acceptance.test.ts.snap

contains rewound snapshot that shows updated format with yield info.

## checklist per contract

- [x] positive path (success) is snapped - case1, case2
- [x] negative path (error) - verified via assertions, not snapped
- [ ] help/usage - no --help snapshot (not applicable - yield is flag, not command)
- [x] edge cases - cascade (case6), absent yield (case1 [t1])
- [x] snapshots show actual output

## error variants assessment

error conditions (case7) are verified via assertions:
- `expect(res.cli.code).not.toEqual(0)`
- `expect(res.cli.stderr).toContain('mutual')`

error output is not snapped. this is acceptable because:
- error messages are simple strings, not structured output
- assertions verify the error message content
- error format is standard across all skills

## conclusion

snapshot coverage is exhaustive for success paths. error paths use assertions instead of snapshots, which is appropriate for error messages.
