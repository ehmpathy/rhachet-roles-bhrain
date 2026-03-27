# self-review r4: has-consistent-conventions

## step back and breathe

r3 was too surface-level. let me read the actual code line-by-line and compare to nearby files.

---

## deep comparison: setSavepoint.ts vs getOneSavepoint.ts

### jsdoc conventions

**getOneSavepoint.ts line 8-13**:
```typescript
/**
 * .what = computes sha256 hash of content
 * .why = matches hash from setSavepoint
 */
const computeHash = (content: string): string =>
```

**setSavepoint.ts line 59-63**:
```typescript
/**
 * .what = generates ISO timestamp for savepoint name
 * .why = consistent timestamp format across all savepoints
 */
const generateTimestamp = (): string => {
```

**verdict**: both use `.what` and `.why` format. consistent.

---

### code paragraph comments

**getOneSavepoint.ts line 31**:
```typescript
// check if savepoint exists
if (!fs.existsSync(stagedPatchPath) || !fs.existsSync(unstagedPatchPath)) {
```

**setSavepoint.ts line 84**:
```typescript
// generate timestamp
const timestamp = generateTimestamp();
```

**setSavepoint.ts line 108**:
```typescript
// ensure directory exists before shell redirect
fs.mkdirSync(savepointsDir, { recursive: true });
```

**verdict**: both use `// one-liner` format for code paragraphs. consistent.

---

### path construction order

**getOneSavepoint.ts line 23-29**:
```typescript
const savepointsDir = path.join(input.scope.storagePath, 'savepoints');
const stagedPatchPath = path.join(savepointsDir, `${input.at}.staged.patch`);
const unstagedPatchPath = path.join(savepointsDir, `${timestamp}.unstaged.patch`);
const commitPath = path.join(savepointsDir, `${input.at}.commit`);
```

**setSavepoint.ts line 94-100**:
```typescript
const savepointsDir = path.join(input.scope.storagePath, 'savepoints');
const stagedPatchPath = path.join(savepointsDir, `${timestamp}.staged.patch`);
const unstagedPatchPath = path.join(savepointsDir, `${timestamp}.unstaged.patch`);
const commitPath = path.join(savepointsDir, `${timestamp}.commit`);
```

**verdict**: identical order and pattern. consistent.

---

### return structure

**getOneSavepoint.ts line 48-60**:
```typescript
return {
  timestamp: input.at,
  commit: {
    hash: commitHash,
  },
  patches: {
    hash,
    stagedPath: stagedPatchPath,
    stagedBytes: Buffer.byteLength(stagedContent),
    unstagedPath: unstagedPatchPath,
    unstagedBytes: Buffer.byteLength(unstagedContent),
  },
};
```

**setSavepoint.ts line 144-156**:
```typescript
return {
  timestamp,
  commit: {
    hash: commitHash,
  },
  patches: {
    hash,
    stagedPath: stagedPatchPath,
    stagedBytes,
    unstagedPath: unstagedPatchPath,
    unstagedBytes,
  },
};
```

**verdict**: identical structure and key order. consistent.

---

### import order

**getOneSavepoint.ts**:
```typescript
import { createHash } from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

import type { ReflectScope } from '../scope/getReflectScope';
import type { Savepoint } from './setSavepoint';
```

**setSavepoint.ts**:
```typescript
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

import type { ReflectScope } from '../scope/getReflectScope';
```

**verdict**: same pattern: node builtins first, then internal imports. consistent.

---

### hash truncation

**getOneSavepoint.ts line 46**:
```typescript
const hash = computeHash(stagedContent + unstagedContent).slice(0, 7);
```

**setSavepoint.ts line 121**:
```typescript
hash = combinedHash.slice(0, 7);
```

**verdict**: both use `.slice(0, 7)` for 7-char hash. consistent.

---

### question: should I use `const` instead of `let`?

**setSavepoint.ts line 103-105**:
```typescript
let hash: string;
let stagedBytes: number;
let unstagedBytes: number;
```

**analysis**: these are declared with `let` because they're assigned conditionally in the if/else block. this is the standard pattern when a value depends on branched logic.

**alternative**: could use ternary or IIFE to make them `const`. but that would complicate the code for no benefit.

**verdict**: `let` is appropriate here. the pattern is: declare, then assign based on mode.

---

### question: is the comment style consistent with briefs?

checked `rule.require.what-why-headers.md`:
> `// one-liner before every logical code block`

my code has one-liner comments before each code paragraph:
- `// generate timestamp`
- `// get HEAD commit hash`
- `// construct paths`
- `// compute hash and sizes`
- `// ensure directory exists`
- `// write diffs directly to files`
- `// hash from files`
- `// sizes from filesystem`
- `// plan mode: hash and sizes`

**verdict**: follows the brief's pattern.

---

## conclusion

deep line-by-line comparison reveals no divergence from extant conventions:
1. jsdoc `.what/.why` format matches
2. code paragraph `// one-liner` format matches
3. path construction order matches
4. return structure matches
5. import order matches
6. hash truncation matches
7. `let` for conditional assignment is appropriate
8. comment style matches briefs

r4 complete.
