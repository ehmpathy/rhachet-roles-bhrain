# self-review r3: has-consistent-conventions

## identify extant conventions

### file name patterns in savepoint/

| file | pattern |
|------|---------|
| `getOneSavepoint.ts` | `getOne{Noun}` |
| `getAllSavepoints.ts` | `getAll{Nouns}` |
| `setSavepoint.ts` | `set{Noun}` |

my implementation: modified `setSavepoint.ts` — no rename, no new files.

**verdict**: consistent. filename unchanged.

---

### variable name patterns

examined extant code in `setSavepoint.ts` and nearby files.

| convention | examples | my code |
|------------|----------|---------|
| `{noun}Path` for file paths | `stagedPatchPath`, `unstagedPatchPath`, `commitPath` | same |
| `{noun}Dir` for directories | `savepointsDir` | same |
| `cwd` for current directory | `const cwd = input.scope.gitRepoRoot` | same |
| `{noun}Bytes` for sizes | `stagedBytes`, `unstagedBytes` | same |
| `{noun}Hash` for hashes | `commitHash`, `combinedHash` | same |

**verdict**: all variables follow extant patterns.

---

### function signature conventions

examined extant `setSavepoint` signature:

```typescript
export const setSavepoint = (input: {
  scope: ReflectScope;
  mode: 'plan' | 'apply';
}): Savepoint
```

my implementation: signature unchanged.

**verdict**: consistent. no divergence.

---

### interface conventions

examined `Savepoint` interface:

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

my implementation: interface unchanged.

**verdict**: consistent. no divergence.

---

### shell command patterns

searched for extant shell command patterns in TypeScript files.

| pattern | example | my code |
|---------|---------|---------|
| `execSync(cmd, { cwd })` | `getGitDiffStats.ts` | same |
| `execSync(cmd, { cwd, encoding: 'utf-8' })` | multiple files | same |
| `${variable}` in template literals | extant in many files | same |
| double-quoted paths in shell | `"${path}"` | same |

**verdict**: shell invocation follows extant patterns.

---

### import conventions

examined imports in `setSavepoint.ts`:

```typescript
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
```

my implementation: removed `crypto` import (no longer needed). retained `execSync`, `fs`, `path`.

**verdict**: consistent. removed unused import.

---

## search for divergence

### new terms introduced?

| term | introduced? | justification |
|------|-------------|---------------|
| `combinedHash` | no | extant in prior implementation |
| `sha256sum` | yes (shell) | unix standard, documented in blueprint |
| `shasum` | yes (shell) | macos standard, documented in blueprint |
| `wc -c` | yes (shell) | unix standard for byte count |

**analysis**: new shell commands are unix standards, not invented terms. they're documented in the blueprint.

### namespace divergence?

no. all code remains in `setSavepoint.ts` in `domain.operations/reflect/savepoint/`.

### prefix/suffix divergence?

no. all variable names follow extant `{noun}{Role}` pattern.

---

## conclusion

no divergence from extant conventions:
1. filename unchanged
2. variable names follow extant patterns
3. function signature unchanged
4. interface unchanged
5. shell invocation follows extant patterns
6. imports follow extant patterns
7. new shell commands are unix standards (not invented terms)

r3 complete.
