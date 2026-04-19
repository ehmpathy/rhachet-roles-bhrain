# self-review: behavior-declaration-coverage (r4)

## wish requirements verification

I verified each requirement from the wish against the implementation.

### requirement 1: --mode hard | soft flags

**wish**: "we should be able to prescribe, on stone --as rewound, the ability to rewound --mode hard | soft"

**implementation**: `--yield drop|keep` with `--hard`/`--soft` aliases

**code location**: `route.ts` lines 770-810

**verdict**: covered. aliases provide the requested terminology.

### requirement 2: soft keeps yields

**wish**: "soft should just do the current rewind, where it keeps the yields that were created"

**implementation**: default is `keep`, `--soft` also means `keep`

**code location**: `route.ts` line 806 - defaults to `'keep'`

**verdict**: covered.

### requirement 3: hard removes yields

**wish**: "--mode hard should remove the yields too"

**implementation**: `--yield drop` (or `--hard`) archives yields to `.route/.archive/`

**code location**: `archiveStoneYield.ts`, `setStoneAsRewound.ts` lines 96-101

**verdict**: covered. yields are moved out of the way (archived, not deleted).

### requirement 4: focus on yield files only

**wish**: "for now, only focus on the $stone.yield.md file in --hard mode"

**implementation**: glob pattern `${stone}.yield*` catches `.yield.md` and variations

**code location**: `archiveStoneYield.ts` line 21

**verdict**: covered. broader than minimum but doesn't touch src files.

### requirement 5: don't roll back src

**wish**: "no need, in case the stone artifacts include src, to roll those back"

**implementation**: only yield files (via glob) are affected. src files untouched.

**verification**: the glob `${stone}.yield*` cannot match src files.

**verdict**: covered.

### requirement 6: cascade to all rewound stones

**wish**: "for all the stones that got rewound when hard mode"

**implementation**: `setStoneAsRewound` applies yield mode to all affected stones in cascade

**code location**: `setStoneAsRewound.ts` lines 83-113 (loop over affectedStones)

**verdict**: covered.

### requirement 7: acceptance tests with snapshots

**wish**: "as usual, cover with acpt tests and prove via snaps before and after rewound"

**implementation**: `driver.route.set.yield.acceptance.test.ts` with 51 tests

**snapshot files**: created in `__snapshots__/` directory

**verdict**: covered.

## conclusion

all 7 requirements from the wish are covered:
1. flags ✓
2. soft behavior ✓
3. hard behavior ✓
4. yield focus ✓
5. no src rollback ✓
6. cascade ✓
7. acceptance tests ✓
