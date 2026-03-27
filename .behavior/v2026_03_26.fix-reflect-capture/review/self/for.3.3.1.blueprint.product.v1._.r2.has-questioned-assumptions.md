# self-review r2: has-questioned-assumptions

## step back and breathe

tea. patience. the review is the work.

in r1, I listed assumptions and found one action item. now I slow down and question each assumption again with fresh eyes.

---

## assumption 1: sha256sum is available

**what we assume**: sha256sum exists on target systems

**r1 verdict**: "holds for target platform"

**r2 deeper question**: is this true? let me verify.

rhachet targets unix systems. `sha256sum` is part of GNU coreutils, standard on linux. on macOS, it's `shasum -a 256` instead.

**issue found**: macOS uses `shasum -a 256`, not `sha256sum`.

**fix needed**: use portable hash command:
```bash
# linux
sha256sum file | cut -d' ' -f1

# macos
shasum -a 256 file | cut -d' ' -f1

# portable
(sha256sum file 2>/dev/null || shasum -a 256 file) | cut -d' ' -f1
```

**action**: update blueprint to use portable hash command.

---

## assumption 2: shell redirect handles large output

**what we assume**: `git diff > file` works for any size

**r1 verdict**: "holds (unix design)"

**r2 deeper question**: are there edge cases?

shell redirect is a kernel-level stream operation. no buffer in the shell process. the kernel streams bytes from git's stdout to the file descriptor.

**edge cases considered**:
- very large files (>100GB): would work, limited by disk space
- no disk space: clear error "No space left on device"
- permissions: clear error if directory not writable

**verdict**: assumption holds. shell redirect is robust.

---

## assumption 3: plan mode diffs are <50MB

**what we assume**: users don't preview 50MB diffs

**r1 verdict**: "reasonable" with action to add better error

**r2 deeper question**: did I apply the fix?

yes. I updated the blueprint to include try/catch with helpful error:
```
'diff too large for plan mode (>50MB). use apply mode to capture large diffs.'
```

**verification**: confirmed by re-read of blueprint file.

**verdict**: assumption acceptable with escape hatch.

---

## assumption 4: two codepaths are necessary

**what we assume**: plan mode must not write files

**r1 verdict**: "holds (preserves semantics)"

**r2 deeper question**: could we unify the codepaths?

alternative considered: plan mode could write to temp, compute metadata, delete temp.

```typescript
// alternative: unified codepath
const tempDir = os.tmpdir();
const tempStagedPath = path.join(tempDir, `staged-${timestamp}.patch`);
execSync(`git diff --staged > "${tempStagedPath}"`, { cwd });
const hash = execSync(`sha256sum "${tempStagedPath}" | cut -d' ' -f1`).trim();
const size = fs.statSync(tempStagedPath).size;
if (mode === 'plan') fs.unlinkSync(tempStagedPath);
if (mode === 'apply') fs.renameSync(tempStagedPath, finalPath);
```

**tradeoffs**:
| approach | pros | cons |
|----------|------|------|
| two codepaths | simple plan mode, no temp files | duplicate logic |
| unified with temp | single codepath | temp file cleanup, more complex |

**verdict**: two codepaths is simpler. the "duplicate" logic is actually different logic (shell vs node). retain two codepaths.

---

## assumption 5: `cat | sha256sum` is correct

**what we assume**: concatenate then hash matches old behavior

**r1 verdict**: "holds (verified)"

**r2 deeper question**: let me trace through the old code.

old code:
```typescript
const stagedPatch = execSync('git diff --staged', { encoding: 'utf-8' });
const unstagedPatch = execSync('git diff', { encoding: 'utf-8' });
const hash = computeHash(stagedPatch + unstagedPatch).slice(0, 7);
```

new code:
```bash
cat staged.patch unstaged.patch | sha256sum | cut -d' ' -f1
```

**character set question**: old code uses utf-8 decode then concatenate. new code concatenates raw bytes.

**does this matter?**: both produce the same hash IF the files are utf-8. git diff output is always utf-8. so the hash will match.

**edge case**: binary diffs? git diff shows binary as "Binary files differ", not raw bytes. still utf-8 safe.

**verdict**: assumption holds. byte-level concat matches string concat for utf-8 content.

---

## fixes applied in this review

| issue | fix location | status |
|-------|--------------|--------|
| macOS uses `shasum -a 256` | blueprint § apply mode | **applied** |
| plan mode error message | blueprint § plan mode | done in prior edit |

---

## conclusion

r2 found a real issue: macOS uses `shasum -a 256` not `sha256sum`.

fix applied to blueprint:
```bash
cat file1 file2 | (sha256sum 2>/dev/null || shasum -a 256) | cut -d' ' -f1
```

all assumptions have been verified. blueprint is ready.
