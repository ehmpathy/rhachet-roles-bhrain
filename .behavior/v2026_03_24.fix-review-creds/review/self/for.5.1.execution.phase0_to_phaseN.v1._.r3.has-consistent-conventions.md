# self-review: has-consistent-conventions (r3)

## stone: 5.1.execution.phase0_to_phaseN.v1

---

## third pass — name conventions

paused. re-read the code. asked: do our names follow extant conventions?

---

## convention 1: function name pattern

**what we wrote:** `getXaiCredsFromKeyrack`

**extant patterns in domain.operations:**

| pattern | usage | examples |
|---------|-------|----------|
| `getOne*` | single entity lookup by key | `getOneSavepoint`, `getOneSnapshot` |
| `getAll*` | multiple entity enumeration | `getAllSavepoints`, `getAllStones` |
| `get*` (plain) | computed/derived values | `getReflectScope`, `getResearchBind`, `getRouteBind` |

**what category is ours?**

`getXaiCredsFromKeyrack` fetches a single set of credentials from keyrack. it is:
- not a lookup by key (no id/uuid input)
- not an enumeration (returns one result)
- a fetch/retrieval operation

**closest parallel:** `getResearchBind`, `getRouteBind` — both return a single derived result.

**verdict:** `getXaiCredsFromKeyrack` follows the plain `get*` pattern for derived values. consistent.

---

## convention 2: file path structure

**what we wrote:** `src/domain.operations/credentials/getXaiCredsFromKeyrack.ts`

**extant patterns:**

| domain | folder |
|--------|--------|
| review operations | `domain.operations/review/` |
| reflect operations | `domain.operations/reflect/` |
| route operations | `domain.operations/route/` |
| git operations | `domain.operations/git/` |

**our choice:** `domain.operations/credentials/`

this follows the pattern: `domain.operations/{domain-noun}/`

**verdict:** consistent with extant folder structure.

---

## convention 3: file name matches export

**what we wrote:**
- file: `getXaiCredsFromKeyrack.ts`
- export: `export const getXaiCredsFromKeyrack`

**extant pattern:** file name matches exported function name.

examples:
- `getReflectScope.ts` exports `getReflectScope`
- `getAllStones.ts` exports `getAllStones`

**verdict:** consistent. file name matches export.

---

## convention 4: keyrack manifest name

**what we wrote:** `src/domain.roles/reviewer/keyrack.yml`

**extant pattern in rhachet:**

keyrack manifests are named `keyrack.yml` and placed in role folders.

searched rhachet-roles-ehmpathy:
- `src/domain.roles/mechanic/keyrack.yml` exists

**verdict:** consistent with keyrack manifest convention.

---

## convention 5: import alias

**what we wrote:**
```typescript
import { getXaiCredsFromKeyrack } from '@src/domain.operations/credentials/getXaiCredsFromKeyrack';
```

**extant pattern:**

all internal imports use `@src/` alias.

examples from review.ts:
```typescript
import { stepReview } from '@src/domain.operations/review/stepReview';
```

**verdict:** consistent with `@src/` alias convention.

---

## convention 6: variable names

**what we wrote:**
- `grant` for keyrack result
- `apiKey` for the extracted key
- `isXaiBrain` for the boolean check

**extant patterns:**

| pattern | examples |
|---------|----------|
| result of fetch | `grant`, `result`, `response` |
| boolean prefix | `is*`, `has*`, `should*` |
| key/secret | `apiKey`, `token`, `secret` |

**verdict:** all variable names follow extant patterns.

---

## convention 7: type import

**what we wrote:**
```typescript
import { type KeyrackGrantAttempt, keyrack } from 'rhachet/keyrack';
import type { BrainSuppliesXai } from 'rhachet-brains-xai';
```

**extant pattern:**

- `type` keyword for type-only imports
- runtime imports without `type` keyword

**verdict:** consistent with extant type import pattern.

---

## final assessment

| convention | our usage | extant pattern | consistent? |
|------------|-----------|---------------|-------------|
| function name | `getXaiCredsFromKeyrack` | `get*` for derived | yes |
| folder path | `credentials/` | `{domain}/` | yes |
| file name | matches export | matches export | yes |
| manifest name | `keyrack.yml` | `keyrack.yml` | yes |
| import alias | `@src/` | `@src/` | yes |
| variable names | `grant`, `apiKey`, `isXaiBrain` | standard patterns | yes |
| type imports | `import type` | `import type` | yes |

**conventions violated:** none.

all names and patterns align with extant conventions in this repo.

