# self-review r1: has-consistent-mechanisms

## step back and breathe

search for related mechanisms. check if blueprint duplicates extant functionality.

---

## search for related codepaths

### search 1: git diff patterns

```
grep "execSync.*git diff"
```

**found**:
- `setSavepoint.ts:100` — `execSync('git diff --staged', ...)`
- `setSavepoint.ts:106` — `execSync('git diff', ...)`

**analysis**: these are the lines the blueprint fixes. no other git diff patterns in codebase.

### search 2: hash patterns

```
grep "computeHash|sha256|shasum"
```

**found**:
- `setSavepoint.ts:12` — defines `computeHash()`
- `getOneSavepoint.ts:12` — defines identical `computeHash()`
- `computeStoneJudgeInputHash.ts:64` — inline `createHash('sha256')`
- `computeStoneReviewInputHash.ts:38` — inline `createHash('sha256')`

**analysis**: `computeHash` is duplicated across two files (extant duplication, not from blueprint). blueprint plan mode reuses extant `computeHash`. blueprint apply mode uses shell hash.

### search 3: maxBuffer patterns

```
grep "maxBuffer"
```

**found**: none

**analysis**: no extant maxBuffer usage. blueprint introduces it for plan mode.

### search 4: shell redirect patterns

```
grep "shell.*redirect|exec.*>"
```

**found**: none relevant (only `exec node` for CLI entry points)

**analysis**: no extant shell redirect for large output. blueprint introduces it for apply mode.

---

## for each new mechanism in blueprint

### mechanism 1: shell redirect for diff output

**blueprint**:
```typescript
execSync(`git diff --staged > "${stagedPatchPath}"`, { cwd })
```

**does codebase have this?**: no. this pattern is new.

**is this duplication?**: no. extant code buffers in node. shell redirect is the fix.

**verdict**: not duplication. this is the fix.

### mechanism 2: shell hash via sha256sum

**blueprint**:
```typescript
execSync(`cat staged unstaged | (sha256sum || shasum -a 256) | cut -d' ' -f1`)
```

**does codebase have this?**: no. codebase uses node crypto.

**is this duplication?**: no. this is required because content is now in files, not node memory.

**verdict**: not duplication. necessary because apply mode writes to files first.

### mechanism 3: maxBuffer for plan mode

**blueprint**:
```typescript
const MAX_BUFFER = 50 * 1024 * 1024; // 50MB
execSync('git diff', { maxBuffer: MAX_BUFFER })
```

**does codebase have this?**: no. no extant maxBuffer usage.

**is this duplication?**: no. plan mode needs buffer (no file writes).

**verdict**: not duplication. plan mode requires in-memory approach.

### mechanism 4: fs.statSync for size

**blueprint**:
```typescript
const stagedBytes = fs.statSync(stagedPatchPath).size;
```

**does codebase have this?**: yes, `fs.statSync` is used elsewhere. this is standard node API.

**is this duplication?**: no. this is standard API usage, not a custom mechanism.

**verdict**: not duplication. standard API.

---

## extant duplication found (not from blueprint)

`computeHash` is defined identically in two files:
- `setSavepoint.ts:12`
- `getOneSavepoint.ts:12`

**is this from blueprint?**: no. this is extant duplication.

**should blueprint fix this?**: no. out of scope. the wish is "fix ENOBUFS", not "refactor hash utilities".

---

## summary

| mechanism | duplicates extant? | verdict |
|-----------|-------------------|---------|
| shell redirect | no | new (the fix) |
| shell hash | no | necessary for apply mode |
| maxBuffer | no | necessary for plan mode |
| fs.statSync | no (standard API) | reuse |

no duplication introduced. blueprint is consistent with codebase.
