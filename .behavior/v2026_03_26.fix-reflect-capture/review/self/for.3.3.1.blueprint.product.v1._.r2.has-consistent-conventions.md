# self-review r2: has-consistent-conventions

## step back and breathe

r1 found no convention divergence. let me question deeper.

---

## question 1: does `MAX_BUFFER` follow extant constant scope patterns?

**where is it used?**: inside `setSavepoint` function only.

**extant pattern for local constants**: file-level `const` for reusable values.

**examples from codebase**:
- `computeHash` is defined at file level
- `ASSETS_DIR` is file level in tests

**is `MAX_BUFFER` file level?**: blueprint shows it inside plan mode block.

**should it be file level?**: could be either. local is fine for single use.

**verdict**: no convention violation. local constant is acceptable.

---

## question 2: does shell command style match codebase?

**blueprint uses**:
```bash
git diff --staged > "${stagedPatchPath}"
```

**extant pattern**: search for shell commands in codebase.

let me check how shell commands are structured elsewhere:
- `execSync('git diff --staged', { cwd, ... })` — command as string
- `execSync(\`git ...\`, { cwd })` — template literal for interpolation

**blueprint follows?**: yes. uses template literal for path interpolation.

---

## question 3: does error message style match?

**blueprint does not add custom error messages**.

shell errors flow through naturally:
- "sha256sum: command not found"
- "No space left on device"

**extant pattern**: let node/shell errors propagate.

**blueprint follows?**: yes. no custom error wrapper.

---

## question 4: does comment style match?

**blueprint comments**:
```typescript
// ensure directory exists FIRST (before shell redirect)
// write staged diff directly to file via shell
// compute hash from files via shell (portable: linux sha256sum, macos shasum)
```

**extant pattern**: single-line comments with lowercase, describe what+why.

**blueprint follows?**: yes. comments match extant style.

---

## summary

| aspect | extant pattern | blueprint follows? |
|--------|---------------|-------------------|
| constant scope | file or local | yes (local) |
| shell command | template literal | yes |
| error messages | propagate natural | yes |
| comment style | lowercase what+why | yes |

r2 confirms r1. no convention divergence found.
