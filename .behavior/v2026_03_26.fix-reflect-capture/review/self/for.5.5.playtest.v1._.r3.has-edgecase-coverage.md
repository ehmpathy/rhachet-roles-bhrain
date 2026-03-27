# self-review r3: has-edgecase-coverage

## step back and breathe

question: are edge cases covered?

I will trace each edge case through the actual implementation code in `setSavepoint.ts`.

---

## code trace: edge case behavior

I read `setSavepoint.ts` lines 1-150:

### empty diff handling

**code (lines 112-113):**
```typescript
execSync(`git diff --staged > "${stagedPatchPath}"`, { cwd });
execSync(`git diff > "${unstagedPatchPath}"`, { cwd });
```

**behavior when diff is empty:**
- `git diff --staged` with no staged changes outputs empty string
- `> "${stagedPatchPath}"` creates an empty file (0 bytes)
- `fs.statSync(stagedPatchPath).size` returns 0

**playtest coverage:**
- edgey paths (line 84-89): `git reset HEAD large.txt` unstages the file
- expected: `staged.patch = 0ytes`
- verified: this is exactly what the code produces

### mixed staged/unstaged handling

**code (lines 112-113):**
```typescript
// staged and unstaged are independent commands
execSync(`git diff --staged > "${stagedPatchPath}"`, { cwd });
execSync(`git diff > "${unstagedPatchPath}"`, { cwd });
```

**behavior:**
- each diff is captured independently
- if staged is empty, unstaged can still be non-empty (and vice versa)
- the commands don't depend on each other

**playtest coverage:**
- edgey paths (lines 95-103): creates both staged and unstaged
- expected: both `staged.patch` and `unstaged.patch` with sizes
- verified: code handles independently via separate `execSync` calls

### very large diff handling

**code (line 112):**
```typescript
execSync(`git diff --staged > "${stagedPatchPath}"`, { cwd });
```

**behavior:**
- shell redirect `>` writes directly to file
- no node buffer involved
- git's stdout goes directly to file via OS pipe
- no size limit (beyond disk space and OS limits)

**playtest coverage:**
- happy path 2 (line 55): creates 15000 lines × ~80 chars = 1.2MB
- expected: `exit 0, no ENOBUFS`
- verified: shell redirect bypasses node buffer

### hash computation edge cases

**code (lines 117-121):**
```typescript
const combinedHash = execSync(
  `cat "${stagedPatchPath}" "${unstagedPatchPath}" | (sha256sum 2>/dev/null || shasum -a 256) | cut -d' ' -f1`,
  { cwd, encoding: 'utf-8' },
).trim();
```

**edge case: both files empty:**
- `cat "" "" | sha256sum` returns sha256 of empty string
- hash is deterministic: `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`
- `.slice(0, 7)` returns `e3b0c44`

**edge case: sha256sum absent:**
- `sha256sum 2>/dev/null` fails silently
- `|| shasum -a 256` fallback runs
- macOS uses shasum, Linux uses sha256sum
- both produce same format: `<hash>  -`

**playtest coverage:**
- not explicitly tested but portable fallback is coded
- rare failure mode — both tools standard on their platforms

### plan mode vs apply mode

**code (lines 107, 126):**
```typescript
if (input.mode === 'apply') {
  // ... writes files via shell redirect
} else {
  // ... uses pipes, no files written
}
```

**plan mode (lines 128-141):**
- hash via pipe: `(git diff --staged; git diff) | sha256sum`
- size via pipe: `git diff --staged | wc -c`
- no files written to disk

**apply mode (lines 108-125):**
- `fs.mkdirSync(savepointsDir, { recursive: true })` ensures dir exists
- shell redirect writes files
- hash from extant files
- sizes from filesystem

**playtest coverage:**
- happy paths 1, 2 use plan mode (no --mode apply)
- happy path 3 uses apply mode
- verified: both branches are tested

---

## edge cases NOT in playtest but handled by code

| edge case | code handling | why no playtest needed |
|-----------|---------------|------------------------|
| directory doesn't exist | `fs.mkdirSync({ recursive: true })` line 109 | standard mkdir behavior |
| binary files in diff | `git diff` outputs "Binary files differ" | handled by git, not our code |
| unicode in diff | shell redirect handles any bytes | OS-level, not our code |
| permission denied | shell fails with clear error | environmental, not fixable |
| disk full | shell fails with "No space left" | environmental, not fixable |

---

## trace playtest assertions to code

| playtest assertion | code line | behavior |
|--------------------|-----------|----------|
| `staged.patch = [SIZE]ytes` | 124: `fs.statSync(stagedPatchPath).size` | returns byte count |
| `staged.patch = 0ytes` | 124: `.size` on empty file returns 0 | standard fs behavior |
| `exits 0, no ENOBUFS` | 112: shell redirect | no buffer involved |
| `SIZE > 1000000` | 112: shell redirect | no size limit |

---

## why it holds

1. **empty diff** — shell redirect creates empty file, `fs.statSync().size` returns 0 (line 124)
2. **large diff** — shell redirect bypasses node buffer (line 112)
3. **mixed state** — staged and unstaged are independent commands (lines 112-113)
4. **both modes** — `if/else` branch covers plan and apply (lines 107, 126)
5. **hash portable** — fallback `(sha256sum || shasum -a 256)` covers Linux and macOS (line 118)

---

## found issues

### no issues found

all edge cases in the playtest are handled by the code:
- empty diff → empty file → size 0
- large diff → shell redirect → no buffer
- mixed state → independent commands
- plan vs apply → separate branches

gaps (binary, unicode, permissions) are environmental and handled by shell with clear errors.

---

## summary

| edge case | code line | playtest section |
|-----------|-----------|------------------|
| empty staged diff | 112, 124 | edgey paths |
| large diff (>1MB) | 112 | happy path 2 |
| mixed staged/unstaged | 112-113 | edgey paths |
| plan mode | 128-141 | happy paths 1, 2 |
| apply mode | 108-125 | happy path 3 |

**conclusion:** edge cases are covered. the playtest assertions map directly to specific code lines. the shell redirect mechanism handles size limits, and independent commands handle mixed states. environmental errors produce clear messages from the shell.

r3 complete.
