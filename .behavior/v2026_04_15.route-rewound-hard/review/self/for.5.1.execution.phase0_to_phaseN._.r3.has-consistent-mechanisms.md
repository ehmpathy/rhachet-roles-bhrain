# self-review: has-consistent-mechanisms (r3)

## deeper codebase search

I searched the codebase for related patterns to verify consistency.

### 1. file move pattern: fs.rename

**search**: `grep 'fs.rename|moveFile'`

**results**: only `archiveStoneYield.ts:51` uses `fs.rename`

**verdict**: no extant file move utility to reuse. inline `fs.rename` is appropriate.

### 2. timestamp format for filenames

**search**: `grep "replace.*[:.]/g"`

**results**:
- `stepReview.ts:107` - `new Date().toJSON().replace(/[:.]/g, '-')`
- `genDefaultReviewOutputPath.ts:22` - same pattern
- `createDraftDirectory.ts:16` - same pattern
- `archiveStoneYield.ts:46` - same pattern (my code)

**analysis**: the filename-safe timestamp pattern is repeated inline across the codebase. there's no shared utility for this.

**verdict**: my code follows the extant pattern. I used the same inline transformation as other files. consistent, not duplicative.

### 3. glob enumeration

**search**: `grep 'enumFilesFromGlob'`

**results**: used in 15+ files throughout the codebase, such as:
- `delStoneGuardArtifacts.ts` - for guard artifact enumeration
- `getAllStones.ts` - for stone enumeration
- `archiveStoneYield.ts` - for yield file enumeration (my code)

**verdict**: reused extant utility. consistent.

### 4. archive directory pattern

**search**: `grep '\.archive'`

**results**: only my code uses `.route/.archive/`

**analysis**: this is a new pattern. the extant pattern for guard artifacts is deletion (`fs.rm`), not archive.

**why different**: yield files represent work products (effort); guard artifacts represent validation state (transient). different semantics warrant different mechanisms.

**verdict**: intentionally new pattern for a new use case. not duplication.

### 5. directory creation

**search for mkdir patterns**:
- `archiveStoneYield.ts` uses `fs.mkdir(archiveDir, { recursive: true })`

**extant pattern**: same pattern used elsewhere (e.g., `createDraftDirectory.ts`)

**verdict**: consistent with extant directory creation pattern.

### conclusion

no duplication found:
1. file move: no extant utility, used `fs.rename` directly
2. timestamp format: same inline pattern as other files
3. glob enumeration: reused `enumFilesFromGlob`
4. archive directory: new pattern for new semantic (recoverable vs permanent)
5. directory creation: same `fs.mkdir` pattern as elsewhere

all mechanisms are either reused from extant code or follow established patterns.
