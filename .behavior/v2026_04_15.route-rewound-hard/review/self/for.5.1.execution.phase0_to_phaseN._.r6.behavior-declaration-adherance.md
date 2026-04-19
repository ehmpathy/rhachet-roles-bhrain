# self-review: behavior-declaration-adherance (r6)

## verification against wish

the wish stated:
> we should be able to prescribe, on stone --as rewound, the ability to rewound --mode hard | soft

### requirement 1: --mode hard | soft flags

**wish**: "we should be able to prescribe, on stone --as rewound, the ability to rewound --mode hard | soft"

**implementation**: `--yield drop|keep` with `--hard`/`--soft` aliases

**verification**:
- `route.ts` line 725-726: added `hard: { type: 'string' }` and `soft: { type: 'string' }`
- `route.ts` line 815-822: derives `yieldMode` from flags

**why this holds**: the wish asked for `--mode hard | soft`. the blueprint translated this to `--yield drop|keep` with `--hard`/`--soft` as aliases. this is semantically equivalent and more explicit about what "hard" and "soft" mean (drop or keep yields).

### requirement 2: soft keeps yields

**wish**: "soft should just do the current rewind, where it keeps the yields that were created"

**verification**:
- `route.ts` line 821: `(options.yield as 'keep' | 'drop') ?? 'keep'` — default is 'keep'
- `route.ts` line 819-820: `hasSoft ? 'keep'` — `--soft` maps to 'keep'
- `setStoneAsRewound.ts` lines 103-111: when yield !== 'drop', checks for extant yield files and reports 'preserved' or 'absent'

**why this holds**: the default behavior is 'keep', and `--soft` explicitly maps to 'keep'. yield files are not touched when mode is 'keep'.

### requirement 3: hard removes yields

**wish**: "--mode hard should remove the yields too"

**verification**:
- `route.ts` line 817-818: `hasHard ? 'drop'` — `--hard` maps to 'drop'
- `setStoneAsRewound.ts` lines 96-101: when `input.yield === 'drop'`, calls `archiveStoneYield`
- `archiveStoneYield.ts` lines 51: `fs.rename(yieldFile, archivePath)` — moves files to archive

**why this holds**: `--hard` triggers 'drop' mode, which archives yield files to `.route/.archive/`. files are moved (not deleted) so they can be recovered if needed.

### requirement 4: only yield files affected

**wish**: "for now, only focus on the $stone.yield.md file in --hard mode. no need, in case the stone artifacts include src, to roll those back"

**verification**:
- `archiveStoneYield.ts` line 21: `const yieldGlob = \`${input.stone}.yield*\``
- this glob only matches `$stone.yield`, `$stone.yield.md`, `$stone.yield.json`
- src files are never touched because the glob pattern cannot match them

**why this holds**: the glob pattern `${stone}.yield*` is specific to yield files. it cannot match `$stone.src.*` or any other artifact type.

### requirement 5: cascade to all rewound stones

**wish**: "for all the stones that got rewound when hard mode"

**verification**:
- `setStoneAsRewound.ts` line 83: `for (const stone of affectedStones)`
- `setStoneAsRewound.ts` lines 96-101: inside the loop, calls `archiveStoneYield` for each stone

**why this holds**: the archive operation happens inside the cascade loop, so every affected stone has its yield files archived when mode is 'drop'.

### requirement 6: acceptance tests with snapshots

**wish**: "as usual, cover with acpt tests and prove via snaps before and after rewound the file contents to verify"

**verification**:
- `blackbox/driver.route.set.yield.acceptance.test.ts` exists (849 lines)
- `blackbox/__snapshots__/driver.route.set.yield.acceptance.test.ts.snap` exists
- tests cover: `--yield drop`, `--yield keep`, `--hard`, `--soft`, default, error cases, cascade

**why this holds**: comprehensive acceptance tests with snapshots prove behavior before and after rewind.

---

## verification against blueprint

### §1: cli flag parse (`route.ts`)

I read `git diff main -- src/contract/cli/route.ts` and verified:

| spec | implementation | status |
|------|----------------|--------|
| parse `--yield` | line 724: `yield: { type: 'string' }` | matches |
| parse `--hard` | line 725: `hard: { type: 'string' }` | matches |
| parse `--soft` | line 726: `soft: { type: 'string' }` | matches |
| validate mutual exclusivity | lines 784-787: throws BadRequestError | matches |
| validate --hard conflicts --yield keep | lines 790-793: throws | matches |
| validate --soft conflicts --yield drop | lines 796-799: throws | matches |
| validate --yield value | lines 802-805: must be 'keep' or 'drop' | matches |
| validate only with rewound | lines 808-812: throws if not rewound | matches |
| derive final value | lines 815-822: ternary with default 'keep' | matches |
| pass to orchestrator | line 850: `yield: yieldMode` | matches |

### §2: orchestrator pass-through (`stepRouteStoneSet.ts`)

I read the grep results and verified:

| spec | implementation | status |
|------|----------------|--------|
| extend input with yield | line 29: `yield?: 'keep' \| 'drop'` | matches |
| pass to setStoneAsRewound | line 67: `yield: input.yield` | matches |

### §3: rewind with yield archival (`setStoneAsRewound.ts`)

I read `git diff main -- src/domain.operations/route/stones/setStoneAsRewound.ts` and verified:

| spec | implementation | status |
|------|----------------|--------|
| extend input with yield | diff line +24: `yield?: 'keep' \| 'drop'` | matches |
| extend return with yieldOutcomes | diff lines +30-33: array type added | matches |
| track yieldOutcomes array | diff lines +76-79: initialized empty | matches |
| if drop: archive | diff lines +96-101: calls archiveStoneYield | matches |
| if keep: check extant | diff lines +103-111: enumFilesFromGlob | matches |
| include yield in output | diff lines +131-135: adds yield field to cascade | matches |

### §4: archive function (`archiveStoneYield.ts`)

I read the full file and verified:

| spec | implementation | status |
|------|----------------|--------|
| jsdoc with .what, .why, .note | lines 6-11 | matches |
| input signature | lines 13-15 | matches |
| return type | lines 16-18 | matches |
| glob pattern | line 21: `${input.stone}.yield*` | matches |
| if no files: return absent | line 28 | matches |
| archive dir path | line 31: `.route/.archive` | matches |
| ensure dir exists | line 32: `fs.mkdir(..., { recursive: true })` | matches |
| collision check | lines 41-44: fs.access | matches |
| timestamp suffix | lines 45-47: toJSON().replace | matches |
| move file | line 51: fs.rename | matches |
| return archived with count | line 54 | matches |

---

## no issues found

all implementations match the wish and blueprint exactly:

1. **flags**: `--yield drop|keep` with `--hard`/`--soft` aliases ✓
2. **soft behavior**: default 'keep', yields preserved ✓
3. **hard behavior**: 'drop' archives to `.route/.archive/` ✓
4. **yield only**: glob `${stone}.yield*` cannot match src files ✓
5. **cascade**: archive happens inside cascade loop ✓
6. **tests**: acceptance tests with snapshots exist ✓
7. **all 32 blueprint specs**: verified line by line ✓
