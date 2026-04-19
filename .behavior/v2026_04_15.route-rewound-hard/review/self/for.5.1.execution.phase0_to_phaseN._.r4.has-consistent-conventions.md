# self-review: has-consistent-conventions (r4)

## code-level convention analysis

I read `archiveStoneYield.ts` and compared to `delStoneGuardArtifacts.ts` line by line.

### 1. import statements

**archiveStoneYield.ts**:
```typescript
import * as fs from 'fs/promises';
import * as path from 'path';
import { enumFilesFromGlob } from '@src/utils/enumFilesFromGlob';
```

**delStoneGuardArtifacts.ts**:
```typescript
import * as fs from 'fs/promises';
import * as path from 'path';
import { enumFilesFromGlob } from '@src/utils/enumFilesFromGlob';
```

**verdict**: identical import pattern. consistent.

### 2. jsdoc format

**archiveStoneYield.ts**:
```typescript
/**
 * .what = archive all yield files for a stone to .route/.archive/
 * .why = enables --yield drop to move yields out of the way on rewind
 * .note = uses same glob pattern as getAllStoneArtifacts
 */
```

**delStoneGuardArtifacts.ts**:
```typescript
/**
 * .what = deletes all guard artifacts for a stone
 * .why = enables rewind to clear validation state but preserve the artifact
 */
```

**verdict**: follows `.what`, `.why`, `.note` jsdoc convention. consistent.

### 3. input signature

**archiveStoneYield.ts**: `input: { stone: string; route: string }`
**delStoneGuardArtifacts.ts**: `input: { stone: string; route: string }`

**verdict**: identical. consistent.

### 4. variable names

| archiveStoneYield | delStoneGuardArtifacts | pattern |
|-------------------|------------------------|---------|
| `archiveDir` | `routeDir` | `*Dir` for directories |
| `yieldFiles` | `reviewFiles`, `judgeFiles` | `*Files` for arrays |
| `yieldFile` | `filePath` | singular for iteration |
| `baseName` | - | standard `path.basename` result |
| `archivePath` | - | `*Path` for file path |

**verdict**: follows extant camelCase and `*Dir`/`*Files`/`*Path` patterns.

### 5. return type

**archiveStoneYield.ts**: `{ outcome: 'archived' | 'absent'; count: number }`
**delStoneGuardArtifacts.ts**: `{ reviews: number; judges: number; ... }`

**analysis**: delStoneGuardArtifacts returns granular counts (multiple artifact types). archiveStoneYield returns simple count + outcome.

The `outcome` field is needed because setStoneAsRewound must distinguish "files were archived" from "no files to archive". This is clearer than a `count === 0` check.

**verdict**: different but justified. outcome field serves a purpose.

### 6. glob pattern

**archiveStoneYield.ts**: `${input.stone}.yield*`
**getAllStoneArtifacts.ts**: `${input.stone.name}.yield*`

**verdict**: same pattern, documented in jsdoc. consistent.

### conclusion

all conventions match:
1. imports follow same pattern
2. jsdoc uses `.what/.why/.note` format
3. input signature identical
4. variable names follow extant patterns
5. return type differs but justifiably (outcome field needed)
6. glob pattern matches extant usage
