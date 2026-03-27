# self-review r2: has-pruned-backcompat

## step back and breathe

r1 was surface level. let me look deeper at the actual code and question each decision.

---

## re-read the implementation

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

---

## question each backwards-compat element

### 1. `sha256sum || shasum` fallback

**what it is**: the hash command tries `sha256sum` first (linux), falls back to `shasum -a 256` (macos).

**was this explicitly requested?**

let me check the vision:
> the value clicks when a user realizes they can stage an entire refactor — hundreds of files, megabytes of changes — and still capture a snapshot without a second thought.

the vision mentions "users" but doesn't specify platforms. however...

let me check the blueprint:
> compute hash from files via shell (portable: linux sha256sum, macos shasum)

**explicit? yes.** the blueprint explicitly says "portable" and names both tools.

**why it's not assumed**: rhachet is a cli tool used on developer machines. developers use linux and macos. this is target platform coverage, not speculative backcompat.

---

### 2. `2>/dev/null` error suppression

**what it is**: stderr from sha256sum is suppressed before shasum runs.

**was this explicitly requested?**

the blueprint shows:
```typescript
(sha256sum 2>/dev/null || shasum -a 256)
```

**explicit? yes.** the exact pattern is in the blueprint.

**why it's necessary**: without `2>/dev/null`, when sha256sum is absent (macos), the error message would pollute output before shasum runs. this is not backcompat — it's correct shell fallback semantics.

---

### 3. `.slice(0, 7)` for short hash

**what it is**: the full sha256 hash is truncated to 7 characters.

**was this explicitly requested?**

let me check if the prior implementation did this...

from the summary: yes, the prior implementation used `computeHash` which also truncated to 7 chars. this is behavior preservation, not backcompat.

**explicit? implicitly yes.** the `Savepoint` interface requires `patches.hash: string` and the prior behavior was 7 chars. a change would break hash comparison with prior savepoints.

**question for consideration**: is there a reason for exactly 7 chars?

**answer**: 7 hex chars = 28 bits = 268 million possibilities. for savepoint deduplication, this is sufficient. git itself uses 7 chars for short commit hashes.

---

### 4. interface unchanged

**what it is**: `Savepoint` interface and `setSavepoint` signature are unchanged.

**was this explicitly requested?**

from vision:
> the contract doesn't change — we just remove the artificial buffer limit that caused failures.

from blueprint:
> ### setSavepoint signature (unchanged)
> ### Savepoint interface (unchanged)

**explicit? yes.** both vision and blueprint explicitly state unchanged interface.

---

### 5. plan mode computes but doesn't write

**what it is**: plan mode calculates hash and sizes but doesn't write files.

**was this explicitly requested?**

from blueprint:
> plan mode: shell pipes for hash and size (no files written)

**explicit? yes.** blueprint explicitly states plan mode writes no files.

**why it's necessary**: plan mode is preview. to write files in preview would be a side effect. this is correct behavior, not backcompat.

---

## search for assumed-but-not-requested backcompat

### candidate: could we have changed the hash algorithm?

**question**: did we assume sha256 "to be safe" or was it explicitly required?

**analysis**: the prior implementation used `crypto.createHash('sha256')`. the new implementation uses sha256sum/shasum. same algorithm, different executor.

**is this backcompat?** no. we maintained the algorithm because a change would break hash comparison with prior savepoints. this is data integrity, not assumed backcompat.

### candidate: could we have changed the timestamp format?

**question**: did we assume the timestamp format "to be safe"?

**analysis**: `generateTimestamp()` was explicitly marked as "retain" in the blueprint codepath tree. the format is `YYYY-MM-DD.HHMMSS`. a change would break filename patterns.

**is this backcompat?** no. this is interface preservation explicitly requested.

### candidate: could we have removed the `.commit` file?

**question**: do we still write the commit hash file?

**analysis**: yes. blueprint explicitly marks:
> fs.writeFileSync(commitPath, commitHash) — retain (small, no buffer issue)

**is this backcompat?** no. explicitly requested retention.

---

## conclusion

every backwards-compatible element in the implementation was:
1. explicitly requested in vision or blueprint, OR
2. necessary for data integrity (hash algorithm), OR
3. correct behavior (no side effects in plan mode)

no "to be safe" assumptions found. the implementation is minimal and matches the specification.

r2 complete.
