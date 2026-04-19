# self-review r9: has-consistent-conventions

tea first. then we proceed 🍵

---

## what this review checks

names and patterns in the blueprint should match extant conventions.

---

## extant name conventions in src/domain.operations/route/stones/

| pattern | examples |
|---------|----------|
| `setStoneAs*` | setStoneAsApproved, setStoneAsPassed, setStoneAsRewound |
| `delStone*` | delStone, delStoneGuardArtifacts |
| `getAllStone*` | getAllStones, getAllStoneArtifacts |
| `is*` | isValidStoneName |
| `as*` | asStoneGlob, asArtifactByPriority |
| `compute*` | computeNextStones, computeStoneOrderPrefix |

---

## blueprint names vs conventions

### archiveStoneYield

**proposed name:** `archiveStoneYield`

**convention analysis:**
- verb prefix: `archive` (action verb, like `del`)
- subject: `Stone` (matches pattern)
- context: `Yield` (matches extant yield terminology)

**comparison with extant:**
- `delStoneGuardArtifacts` → del + Stone + GuardArtifacts
- `archiveStoneYield` → archive + Stone + Yield

**verdict:** ✅ follows `[verb][Stone][Context]` pattern

### yield terminology

**extant usage in getAllStoneArtifacts.ts:**
```typescript
`${input.route}/${input.stone.name}.yield*`, // new: .yield, .yield.md
```

**blueprint uses:**
- `yieldPath` — consistent with `.yield.md` pattern
- `yieldOutcomes` — consistent with yield terminology

**verdict:** ✅ yield terminology matches extant codebase

### yieldOutcomes return type

**proposed:**
```typescript
yieldOutcomes: Array<{ stone: string; outcome: 'archived' | 'preserved' | 'absent' }>
```

**analysis:**
- `Outcomes` suffix follows extant pattern for result collections
- `outcome` matches discrete state pattern (archived, preserved, absent)
- no extant `*Outcomes` type to conflict with

**verdict:** ✅ follows extant conventions

### flag names

**proposed flags:**
- `--yield drop|keep` — describes action on yield
- `--hard` / `--soft` — aliases from wish terminology

**analysis:**
- `--yield` follows extant flag pattern (e.g., `--as`, `--stone`)
- `drop|keep` are clear action verbs
- `--hard`/`--soft` match wish terminology

**verdict:** ✅ flag names are clear and consistent

### yieldMode variable

**proposed:**
```typescript
const yieldMode: 'keep' | 'drop' = ...
```

**analysis:**
- camelCase follows codebase convention
- `Mode` suffix indicates enum-like choice
- `yield` prefix matches yield terminology

**verdict:** ✅ follows camelCase variable convention

### archive directory name

**proposed:** `.route/.archive/`

**analysis:**
- follows `.route/` subdirectory pattern
- `.archive` is self-descriptive
- no extant `.archive` directory (new concept)

**verdict:** ✅ follows extant structure conventions

---

## error message conventions

**proposed error messages:**
- `--hard and --soft are mutually exclusive`
- `--hard conflicts with --yield keep`
- `--soft conflicts with --yield drop`
- `--yield only valid with --as rewound`
- `--hard only valid with --as rewound`

**analysis:**
- lowercase, no period (matches extant pattern)
- clear, descriptive
- mentions the conflicted flags explicitly

**verdict:** ✅ follows extant error message conventions

---

## divergence check

| element | extant convention | blueprint | match? |
|---------|-------------------|-----------|--------|
| function name | `[verb][Stone][Context]` | archiveStoneYield | ✅ |
| yield term | `.yield*` files | yield in names | ✅ |
| outcome type | discrete states | archived/preserved/absent | ✅ |
| flag names | descriptive | --yield, --hard, --soft | ✅ |
| variable names | camelCase | yieldMode | ✅ |
| directory | `.route/` subdirs | `.route/.archive/` | ✅ |
| error messages | lowercase, no period | clear conflict descriptions | ✅ |

---

## conclusion

all blueprint names and patterns match extant conventions:
- function name follows `[verb][Stone][Context]` pattern
- yield terminology matches extant codebase
- flag names are clear and descriptive
- directory structure follows extant patterns

no divergence found.

🦉 conventions reviewed. all consistent. so it is.

