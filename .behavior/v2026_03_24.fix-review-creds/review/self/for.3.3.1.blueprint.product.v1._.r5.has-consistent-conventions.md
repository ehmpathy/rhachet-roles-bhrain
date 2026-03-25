# self-review: has-consistent-conventions (r5)

## stone: 3.3.1.blueprint.product.v1

---

## r5: convention consistency pass

took a breath. searched the codebase for name conventions. compared with blueprint.

---

## name conventions in the codebase

### verb prefixes

**search performed**:
```bash
grep -E '^export const (get|set|gen)' src/domain.operations/**/*.ts
```

**extant pattern**:
| prefix | semantic | examples |
|--------|----------|----------|
| `get*` | retrieve/lookup | `getReflectScope`, `getOneSavepoint`, `getAllSavepoints` |
| `set*` | mutate/persist | `setSavepoint`, `setAnnotation`, `setSkillOutputSrc` |
| `gen*` | find-or-create | `genStepArtSet`, `genLoopFeedback`, `genGitHubFileUrl` |

**blueprint proposes**: `getXaiCredsFromKeyrack`

**analysis**: follows `get*` convention for retrieval. consistent.

---

### "From" suffix pattern

**search performed**:
```bash
grep 'From[A-Z]' src/**/*.ts
```

**extant pattern**: 50 files use "From" suffix (e.g., `enumFilesFromGlob`, `enumFilesFromDiffs`)

**blueprint proposes**: `getXaiCredsFromKeyrack` (gets credentials FROM keyrack)

**analysis**: "From" suffix is established convention. consistent.

---

### domain.operations directory structure

**extant structure**:
```
src/domain.operations/
├── artifact/
├── context/
├── git/
├── hooks/
├── reflect/
├── research/
├── review/
└── route/
```

**blueprint proposes**: `src/domain.operations/credentials/getXaiCredsFromKeyrack.ts`

**analysis**: creates new `credentials/` subdirectory. this is consistent with how other domain areas are organized (git/, hooks/, etc.). no extant `credentials/` directory exists, so no conflict.

---

### domain.roles file structure

**search performed**:
```bash
ls src/domain.roles/reviewer/
```

**extant structure**:
```
src/domain.roles/reviewer/
├── skills/
└── README.md (if any)
```

**blueprint proposes**: `src/domain.roles/reviewer/keyrack.yml`

**analysis**: introduces a new `keyrack.yml` at the role root level. this follows rhachet convention (per research on getMechanicRole). consistent with how role manifests work in rhachet ecosystem.

---

### exit code semantic

**extant semantics** (per research):
| code | represents |
|------|------------|
| 0 | success |
| 1 | malfunction (unexpected error) |
| 2 | constraint (user must fix) |

**blueprint proposes**: exit 2 for keyrack errors

**analysis**: keyrack locked/absent/blocked are constraint errors (user must unlock/set). consistent.

---

### error message format

**extant vibe** (route.ts):
```
🦉 patience, friend

🗿 route.bounce
   ├─ blocked
   │  ├─ artifact = ...
   │  └─ guard = ...
```

**blueprint proposes**:
```
🦉 patience, friend

✋ keyrack is locked
   ├─ owner: ehmpath
   └─ run: rhx keyrack unlock ...
```

**analysis**:
- same owl vibe (`🦉 patience, friend`)
- same tree structure (`├─`, `└─`)
- uses `✋` emoji for block/stop (new but appropriate)

**minor observation**: extant pattern uses `🗿` prefix for route commands. blueprint uses `✋` prefix for keyrack errors. both are appropriate — `🗿` is route-specific, `✋` indicates "stop, fix this."

**verdict**: consistent with spirit, appropriate variation for context.

---

### supplier type

**blueprint proposes**: `BrainSuppliesXai`

**analysis**: this is not a new name — it's imported from `rhachet-brains-xai`. we use the external type as-is. no convention to check.

---

### variable names

**blueprint proposes**:
- `isXaiBrain` — boolean for brain detection
- `supplier` — optional supplier context
- `keyrackResult` — result of keyrack fetch

**analysis**:
- `is*` prefix for booleans: standard convention
- `supplier` for supplier context: matches the type name
- `keyrackResult` for operation result: standard `*Result` suffix

**verdict**: consistent with general conventions.

---

## summary table

| name/convention | extant pattern | blueprint | consistent? |
|-----------------|----------------|-----------|-------------|
| `get*` verb | yes | `getXaiCredsFromKeyrack` | yes |
| `*From*` suffix | yes (50 files) | `*FromKeyrack` | yes |
| domain.operations/ subdirs | yes | `credentials/` | yes |
| role manifest | n/a | `keyrack.yml` | rhachet convention |
| exit code 2 | constraint | constraint | yes |
| owl vibe | `🦉 patience` | `🦉 patience` | yes |
| tree structure | `├─`, `└─` | `├─`, `└─` | yes |
| boolean prefix | `is*` | `isXaiBrain` | yes |

---

## open questions

none. all name choices follow extant conventions.

---

## conclusion

all names and patterns in the blueprint are consistent with codebase conventions. no divergence found.

