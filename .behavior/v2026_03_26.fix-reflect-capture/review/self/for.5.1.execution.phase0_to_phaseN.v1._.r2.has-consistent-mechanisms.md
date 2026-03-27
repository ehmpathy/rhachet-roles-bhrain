# self-review r2: has-consistent-mechanisms

## search for related codepaths

searched the codebase for hash computation patterns.

### found: `crypto.createHash` in other files

| file | use case | content size |
|------|----------|--------------|
| `computeStoneJudgeInputHash.ts` | hash review contents + approval state | small (review files) |
| `computeStoneReviewInputHash.ts` | hash artifact contents | small (artifact files) |
| `getOneSavepoint.ts` | hash patch files for read path | variable (reads from disk) |

### found: no shared hash utility

the codebase has no centralized `hashContent()` or `toHashSha256()` utility. each file implements its own hash logic inline.

---

## question: does setSavepoint duplicate extant mechanisms?

### analysis

**before my fix**: `setSavepoint` used `crypto.createHash('sha256')` inline, same as other files.

**after my fix**: `setSavepoint` uses `sha256sum`/`shasum` shell commands instead of node crypto.

**why the difference?**

| file | approach | reason |
|------|----------|--------|
| `computeStoneJudgeInputHash.ts` | node crypto | content is small, already in memory |
| `computeStoneReviewInputHash.ts` | node crypto | content is small, already in memory |
| `getOneSavepoint.ts` | node crypto | reads files, then hashes (read path) |
| `setSavepoint.ts` (new) | shell sha256sum | diff content never enters node (write path) |

the difference is intentional. `setSavepoint` is the **write path** where large diffs caused ENOBUFS. shell redirect avoids that. other files are **read paths** where content is already in memory.

---

## question: does `getOneSavepoint` need the same fix?

`getOneSavepoint` reads patch files and computes hash:

```typescript
const stagedContent = fs.readFileSync(stagedPatchPath, 'utf-8');
const unstagedContent = fs.readFileSync(unstagedPatchPath, 'utf-8');
const hash = computeHash(stagedContent + unstagedContent).slice(0, 7);
```

**potential concern**: read of 10MB patch files into memory.

**analysis**:
- `fs.readFileSync` doesn't have the same 1MB buffer limit as `execSync`
- node can handle multi-MB strings in memory
- ENOBUFS was specific to `execSync` stdout buffer, not general memory

**conclusion**: no fix needed for `getOneSavepoint`. the root cause (execSync buffer) doesn't apply to readFileSync.

---

## question: do the hash algorithms produce identical results?

**shell command**:
```bash
cat "${stagedPatchPath}" "${unstagedPatchPath}" | sha256sum
```

**node crypto (in getOneSavepoint)**:
```typescript
createHash('sha256').update(stagedContent + unstagedContent).digest('hex')
```

**analysis**:
- both read files as UTF-8
- both concatenate with no separator
- both compute SHA-256
- SHA-256 is standardized — same input = same hash

**conclusion**: hash values are compatible. a savepoint created by `setSavepoint` (shell) can be read by `getOneSavepoint` (node) with matched hashes.

---

## question: should I have used a shared hash utility?

**answer**: no shared utility exists in the codebase. the pattern is inline hash computation.

**why no shared utility?**
- each call site has different input shapes (string vs files vs shell)
- abstraction would add complexity without benefit
- the operation is simple: `sha256(content).slice(0, 7)`

**conclusion**: inline implementation is consistent with codebase patterns.

---

## conclusion

no new mechanisms duplicate extant functionality:
1. shell hash is intentional (avoids execSync buffer limit)
2. node hash in other files is appropriate (content already in memory)
3. hash algorithms produce identical results (SHA-256 standardized)
4. no shared utility exists — inline is the pattern

r2 complete.
