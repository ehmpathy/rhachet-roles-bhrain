# self-review r1: has-consistent-conventions

## step back and breathe

search for name conventions in the codebase. check if blueprint follows them.

---

## search for name conventions

### constant names

```
grep "const [A-Z_]+ ="
```

**patterns found**:
- `SKILL_*` — skill exports
- `DEFAULT_*` — default values
- `ASSETS_DIR`, `TARGET_DIR` — test directories
- `BUFSIZE`, `GIT_ENV`, `REPEAT_CONFIG` — misc constants

**convention**: `SCREAMING_SNAKE_CASE` for constants.

**blueprint introduces**: `MAX_BUFFER`

**follows convention?**: yes. `MAX_BUFFER` matches `SCREAMING_SNAKE_CASE`.

### variable names in setSavepoint

```
grep "stagedPatch|unstagedPatch"
```

**patterns found**:
- `stagedPatch`, `unstagedPatch` — diff content
- `stagedPatchPath`, `unstagedPatchPath` — file paths
- `stagedBytes`, `unstagedBytes` — byte sizes
- `stagedContent`, `unstagedContent` — file content (in getOneSavepoint)

**convention**: `<context><Type>` name structure (e.g., `staged` + `Patch`, `staged` + `PatchPath`).

**blueprint introduces**: `combinedHash`

**follows convention?**: yes. `combined` + `Hash` matches pattern.

---

## check each name in blueprint

### name 1: `MAX_BUFFER`

**extant pattern**: `SCREAMING_SNAKE_CASE` for constants (see `BUFSIZE`, `DEFAULT_BRAIN`)

**follows pattern?**: yes.

### name 2: `combinedHash`

**extant pattern**: `camelCase` for variables with `<context><Type>` structure

**follows pattern?**: yes. `combined` (context) + `Hash` (type).

### name 3: `stagedBytes`, `unstagedBytes`

**extant pattern**: already used in codebase

**follows pattern?**: yes. reuse of extant names.

### name 4: `stagedPatchPath`, `unstagedPatchPath`

**extant pattern**: already used in codebase

**follows pattern?**: yes. reuse of extant names.

---

## check structure patterns

### file structure

**extant pattern**: `setSavepoint.ts` is in `domain.operations/reflect/savepoint/`

**blueprint changes**: modifies `setSavepoint.ts` only, no new files

**follows pattern?**: yes. no structural change.

### function signature

**extant pattern**: `(input: { scope, mode })` with typed input object

**blueprint changes**: no signature change

**follows pattern?**: yes.

---

## summary

| name | convention | follows? |
|------|------------|----------|
| `MAX_BUFFER` | `SCREAMING_SNAKE_CASE` | yes |
| `combinedHash` | `camelCase` with `<context><Type>` | yes |
| `stagedBytes` | extant name | yes |
| `stagedPatchPath` | extant name | yes |

no divergence from extant conventions. blueprint is consistent.
