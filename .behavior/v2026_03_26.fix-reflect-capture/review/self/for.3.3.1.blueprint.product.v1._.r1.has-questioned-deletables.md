# self-review r1: has-questioned-deletables

## step back and breathe

review of the blueprint for deletable features and components.

---

## features review

### feature 1: shell redirect for apply mode

**traces to**: vision § summary ("shell redirect writes directly to file")

**verdict**: required. this is the core fix. cannot delete.

### feature 2: sha256sum for hash computation

**traces to**: vision § summary ("sha256sum handles hash")

**verdict**: required. follows from feature 1 — content is in file, not node memory, so shell hash is natural.

### feature 3: fs.statSync for size

**traces to**: vision § summary ("const size = fs.statSync(path).size")

**verdict**: required. follows from feature 1 — content is in file, so read size from file.

### feature 4: maxBuffer increase for plan mode

**traces to**: test research § gap ("plan mode should NOT write files")

**did wisher ask?**: no. this emerged from research.

**should it be deleted?**: let me think...

the test research revealed that plan mode tests expect no file writes. the new shell redirect approach writes files first. so plan mode needs a different approach.

options considered:
1. plan mode uses old approach with maxBuffer — simple, retains behavior
2. plan mode writes to temp, deletes after — wasteful, complex
3. plan mode skips hash/bytes — breaks interface

option 1 is simplest. but is it needed at all?

**question**: when is plan mode actually used?

at `captureSnapshot.ts:86`, it calls `setSavepoint({ mode: 'apply' })`. plan mode exists for preview, but the actual capture always uses apply.

**could we delete plan mode entirely?** no — the interface exposes it and tests verify it.

**could we simplify?** the blueprint already proposes the simplest solution: retain old approach for plan mode.

**verdict**: retain. plan mode maxBuffer is necessary to preserve extant behavior without file side effects.

---

## components review

### component: two codepaths (apply vs plan)

**can this be removed?**: no. apply mode must write files. plan mode must not.

**if we deleted and had to add back, would we?**: yes. the distinction exists for a reason.

**did we optimize what shouldn't exist?**: no. we don't optimize plan mode. we preserve it.

**simplest version?**: the blueprint proposes: apply = new approach, plan = old approach + maxBuffer. this is minimal.

**verdict**: retain. two codepaths are necessary.

### component: computeHash helper

**can this be removed?**: partially. apply mode uses sha256sum. plan mode still uses computeHash.

**did we optimize what shouldn't exist?**: no. computeHash is extant code, not new.

**verdict**: retain for plan mode. the helper stays.

### component: sha256sum via shell

**can this be removed?**: no. this computes hash from file without read into node.

**simplest version?**: `cat file1 file2 | sha256sum | cut -d' ' -f1` — already minimal.

**verdict**: retain.

---

## conclusion

all features trace to vision or research-identified gaps.

all components are necessary for the fix.

no deletions required.

the blueprint is minimal.
