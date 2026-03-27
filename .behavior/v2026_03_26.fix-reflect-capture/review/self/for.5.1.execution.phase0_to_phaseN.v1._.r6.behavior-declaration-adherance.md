# self-review r6: behavior-declaration-adherance

## step back and breathe

r5 was surface-level. let me go line by line through setSavepoint.ts and verify each line against the spec.

---

## file: setSavepoint.ts line-by-line

### lines 1-6: imports

```typescript
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

import type { ReflectScope } from '../scope/getReflectScope';
```

**check against blueprint**:

blueprint does not specify imports, but shows usage of:
- `execSync` for shell commands
- `fs.mkdirSync`, `fs.writeFileSync`, `fs.statSync`
- `path.join`

all required imports present. no extra imports. **ADHERES**.

---

### lines 7-57: Savepoint interface

```typescript
export interface Savepoint {
  timestamp: string;
  commit: { hash: string };
  patches: {
    hash: string;
    stagedPath: string;
    stagedBytes: number;
    unstagedPath: string;
    unstagedBytes: number;
  };
}
```

**check against blueprint**:

blueprint explicitly states:
> ### Savepoint interface (unchanged)
> ```typescript
> export interface Savepoint {
>   timestamp: string;
>   commit: { hash: string };
>   patches: {
>     hash: string;
>     stagedPath: string;
>     stagedBytes: number;
>     unstagedPath: string;
>     unstagedBytes: number;
>   };
> }
> ```

field-by-field comparison:

| blueprint field | implementation field | match? |
|-----------------|---------------------|--------|
| `timestamp: string` | `timestamp: string` | YES |
| `commit: { hash: string }` | `commit: { hash: string }` | YES |
| `patches.hash: string` | `patches.hash: string` | YES |
| `patches.stagedPath: string` | `patches.stagedPath: string` | YES |
| `patches.stagedBytes: number` | `patches.stagedBytes: number` | YES |
| `patches.unstagedPath: string` | `patches.unstagedPath: string` | YES |
| `patches.unstagedBytes: number` | `patches.unstagedBytes: number` | YES |

**ADHERES exactly**.

---

### lines 59-72: generateTimestamp

```typescript
const generateTimestamp = (): string => {
  const now = new Date();
  const date = now.toISOString().split('T')[0];
  const time = now.toISOString().split('T')[1]?.split('.')[0]?.replace(/:/g, '');
  return `${date}.${time}`;
};
```

**check against blueprint codepath tree**:

> `[○] generateTimestamp() -- retain`

"retain" means unchanged from prior implementation. this function is internal, not part of the fix. **ADHERES** (retained as specified).

---

### lines 78-81: function signature

```typescript
export const setSavepoint = (input: {
  scope: ReflectScope;
  mode: 'plan' | 'apply';
}): Savepoint => {
```

**check against blueprint**:

> ### setSavepoint signature (unchanged)
> ```typescript
> export const setSavepoint = (input: {
>   scope: ReflectScope;
>   mode: 'plan' | 'apply';
> }): Savepoint => { ... }
> ```

exact match. **ADHERES**.

---

### lines 82-91: cwd, timestamp, commitHash

```typescript
const cwd = input.scope.gitRepoRoot;
const timestamp = generateTimestamp();
const commitHash = execSync('git rev-parse HEAD', {
  cwd,
  encoding: 'utf-8',
}).trim();
```

**check against blueprint codepath tree**:

> `[○] get HEAD commit hash via execSync -- retain (small output)`

"retain" means unchanged. small output (40 hex chars) fits in default buffer. no change needed here. **ADHERES**.

---

### lines 93-100: construct paths

```typescript
const savepointsDir = path.join(input.scope.storagePath, 'savepoints');
const stagedPatchPath = path.join(savepointsDir, `${timestamp}.staged.patch`);
const unstagedPatchPath = path.join(savepointsDir, `${timestamp}.unstaged.patch`);
const commitPath = path.join(savepointsDir, `${timestamp}.commit`);
```

**check against blueprint codepath tree**:

> `[○] construct paths -- retain`

"retain" means unchanged. path construction is internal, not part of the fix. **ADHERES**.

---

### lines 102-105: declare mutable vars

```typescript
let hash: string;
let stagedBytes: number;
let unstagedBytes: number;
```

**check against blueprint**:

blueprint shows these vars are assigned conditionally based on mode. this is the correct pattern for branched assignment. **ADHERES**.

---

### lines 107-125: apply mode

```typescript
if (input.mode === 'apply') {
  fs.mkdirSync(savepointsDir, { recursive: true });
  execSync(`git diff --staged > "${stagedPatchPath}"`, { cwd });
  execSync(`git diff > "${unstagedPatchPath}"`, { cwd });
  fs.writeFileSync(commitPath, commitHash);
  const combinedHash = execSync(
    `cat "${stagedPatchPath}" "${unstagedPatchPath}" | (sha256sum 2>/dev/null || shasum -a 256) | cut -d' ' -f1`,
    { cwd, encoding: 'utf-8' },
  ).trim();
  hash = combinedHash.slice(0, 7);
  stagedBytes = fs.statSync(stagedPatchPath).size;
  unstagedBytes = fs.statSync(unstagedPatchPath).size;
}
```

**check against blueprint implementation detail**:

blueprint shows:
```typescript
// ensure directory exists FIRST
fs.mkdirSync(savepointsDir, { recursive: true });
```

line 109: `fs.mkdirSync(savepointsDir, { recursive: true });` -- exact match. **ADHERES**.

blueprint shows:
```typescript
execSync(`git diff --staged > "${stagedPatchPath}"`, { cwd });
execSync(`git diff > "${unstagedPatchPath}"`, { cwd });
```

line 112: `execSync(`git diff --staged > "${stagedPatchPath}"`, { cwd });` -- exact match.
line 113: `execSync(`git diff > "${unstagedPatchPath}"`, { cwd });` -- exact match. **ADHERES**.

blueprint shows:
```typescript
const combinedHash = execSync(
  `cat "${stagedPatchPath}" "${unstagedPatchPath}" | (sha256sum 2>/dev/null || shasum -a 256) | cut -d' ' -f1`,
  { cwd, encoding: 'utf-8' },
).trim();
const hash = combinedHash.slice(0, 7);
```

lines 117-121 match exactly. **ADHERES**.

blueprint shows:
```typescript
const stagedBytes = fs.statSync(stagedPatchPath).size;
const unstagedBytes = fs.statSync(unstagedPatchPath).size;
```

lines 124-125 match exactly. **ADHERES**.

**additional check**: line 114 `fs.writeFileSync(commitPath, commitHash);` -- blueprint codepath says:
> `[○] fs.writeFileSync(commitPath, commitHash) -- retain (small, no buffer issue)`

commit hash is 40 chars. no buffer issue. retained as specified. **ADHERES**.

---

### lines 126-142: plan mode

```typescript
} else {
  const combinedHash = execSync(
    `(git diff --staged; git diff) | (sha256sum 2>/dev/null || shasum -a 256) | cut -d' ' -f1`,
    { cwd, encoding: 'utf-8' },
  ).trim();
  hash = combinedHash.slice(0, 7);
  stagedBytes = parseInt(
    execSync(`git diff --staged | wc -c`, { cwd, encoding: 'utf-8' }).trim(),
    10,
  );
  unstagedBytes = parseInt(
    execSync(`git diff | wc -c`, { cwd, encoding: 'utf-8' }).trim(),
    10,
  );
}
```

**check against blueprint**:

blueprint shows:
```typescript
const combinedHash = execSync(
  `(git diff --staged; git diff) | (sha256sum 2>/dev/null || shasum -a 256) | cut -d' ' -f1`,
  { cwd, encoding: 'utf-8' },
).trim();
const hash = combinedHash.slice(0, 7);
```

lines 128-132 match exactly. **ADHERES**.

blueprint shows:
```typescript
const stagedBytes = parseInt(
  execSync(`git diff --staged | wc -c`, { cwd, encoding: 'utf-8' }).trim(),
  10,
);
const unstagedBytes = parseInt(
  execSync(`git diff | wc -c`, { cwd, encoding: 'utf-8' }).trim(),
  10,
);
```

lines 134-141 match exactly. **ADHERES**.

---

### lines 144-157: return statement

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

**check against blueprint codepath tree**:

> `[○] return Savepoint -- retain interface unchanged`

return structure matches Savepoint interface exactly. **ADHERES**.

---

## vision requirements verified

### "diff content never enters node"

traced data flow through code:

1. `git diff --staged > file` (line 112) -- diff goes to file, not node
2. `git diff > file` (line 113) -- diff goes to file, not node
3. `cat files | sha256sum` (line 118) -- returns 64-char hash, not diff
4. `fs.statSync().size` (lines 124-125) -- reads metadata, not content
5. `git diff | wc -c` (lines 135, 139) -- returns byte count, not diff

at no point does diff content enter node. **ADHERES to vision**.

### "large diffs just work"

shell redirect (`>`) has no buffer limit. limit is disk space only.

`wc -c` in plan mode also has no buffer limit -- it counts bytes in the stream.

**ADHERES to vision**.

### "contract doesn't change"

signature unchanged. interface unchanged. behavior unchanged for callers.

**ADHERES to vision**.

---

## criteria requirements verified

### usecase.1: large staged diff

criteria says:
> then('savepoint file contains the complete diff')

implementation uses `git diff --staged > file` which writes complete output to file. **ADHERES**.

### usecase.3: empty staged diff

criteria says:
> then('snapshot is created with empty patch file')

`git diff --staged > file` creates empty file when diff is empty. **ADHERES**.

### usecase.4: both diffs captured

criteria says:
> then('combined hash reflects both diffs')

implementation uses `cat staged unstaged | sha256sum`. **ADHERES**.

---

## conclusion

every line of setSavepoint.ts verified against spec:

1. imports: only required modules
2. interface: unchanged per blueprint
3. signature: unchanged per blueprint
4. apply mode: exact match to blueprint
5. plan mode: exact match to blueprint
6. return: unchanged per blueprint

no deviations found. implementation adheres to behavior declaration.

r6 complete.

