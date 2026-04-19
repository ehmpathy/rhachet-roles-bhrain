# self-review: has-consistent-conventions (r3)

## name convention analysis

### 1. function name: archiveStoneYield

**extant pattern**: `[verb]Stone[Noun]`
- `delStoneGuardArtifacts`
- `setStoneAsRewound`
- `setStoneAsPassed`
- `getAllStoneArtifacts`

**my name**: `archiveStoneYield`

**verdict**: follows extant pattern. verb + Stone + noun.

### 2. term: yield

**search**: `grep 'yield'` in stone operations

**extant usage**:
- `getAllStoneArtifacts.ts:21` - `${input.stone.name}.yield*` pattern
- comment: "new: .yield, .yield.md, .yield.json"

**verdict**: "yield" is established term for stone output files. consistent.

### 3. CLI flag: --yield

**search for extant flag patterns in route.ts**:
- `--stone` - noun target
- `--as` - state change
- `--that` - reference

**my flag**: `--yield drop|keep`

**verdict**: noun flag for a noun target (yield files). consistent with `--stone` pattern.

### 4. CLI aliases: --hard / --soft

**search for alias patterns**:
- `-m` for `--message` (git.commit.set)
- `-q` for `--quiet` (various)

**my aliases**: `--hard` = `--yield drop`, `--soft` = `--yield keep`

**verdict**: follows CLI convention for short/memorable aliases. matches wish terminology.

### 5. outcome states: archived / preserved / absent

**extant state patterns in formatRouteStoneEmit.ts**:
- `passed`, `blocked`, `rewound` (passage states)
- `cached`, `live` (cache states)

**my states**: `archived`, `preserved`, `absent`

**verdict**: consistent with past-tense state name pattern. describes what happened to yield files.

### 6. directory: .route/.archive/

**extant route subdirectories**:
- `.route/` - route root
- `.route/passage.jsonl` - passage log
- no extant archive directory

**verdict**: new directory follows `.` prefix convention for hidden directories. name is descriptive.

### conclusion

all names follow extant conventions:
1. function name follows `[verb]Stone[Noun]` pattern
2. "yield" is established term for stone outputs
3. `--yield` flag follows noun-target pattern
4. `--hard/--soft` follow alias conventions
5. outcome states follow past-tense name pattern
6. `.archive/` follows hidden directory convention
