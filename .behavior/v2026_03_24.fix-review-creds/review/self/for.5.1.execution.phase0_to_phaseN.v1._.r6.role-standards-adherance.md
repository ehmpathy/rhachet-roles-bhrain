# self-review: role-standards-adherance (r6)

## stone: 5.1.execution.phase0_to_phaseN.v1

---

## sixth pass — mechanic role standards

reviewed code against mechanic briefs. enumerated rule categories first.

---

## rule directories checked

| directory | relevance |
|-----------|-----------|
| `lang.terms/` | function names, variable names |
| `lang.tones/` | comments, error messages |
| `code.prod/evolvable.procedures/` | input-context pattern, arrow functions |
| `code.prod/evolvable.repo.structure/` | file paths, imports |
| `code.prod/pitofsuccess.errors/` | fail-fast, exit codes |
| `code.prod/readable.comments/` | jsdoc headers |
| `code.prod/readable.narrative/` | code flow, early returns |

---

## lang.terms checks

### rule.forbid.gerunds

**code reviewed:**
- function name: `getXaiCredsFromKeyrack` — no gerund ✓
- variable names: `grant`, `apiKey`, `isXaiBrain` — no gerunds ✓
- comments: checked all — no gerunds ✓

### rule.require.treestruct

**function name:** `getXaiCredsFromKeyrack`

pattern: `[verb][...noun]` = `get` + `XaiCreds` + `FromKeyrack`

| segment | type |
|---------|------|
| get | verb |
| XaiCreds | noun (what) |
| FromKeyrack | qualifier (source) |

**verdict:** follows treestruct pattern ✓

### rule.require.ubiqlang

**terms used:**
- `creds` — aligns with rhachet-brains-xai sdk
- `grant` — keyrack sdk term
- `supplier` — rhachet pattern term

**verdict:** uses domain vocabulary ✓

---

## code.prod/evolvable.procedures checks

### rule.require.input-context-pattern

**function signature:**
```typescript
export const getXaiCredsFromKeyrack = async (): Promise<{...}>
```

no `(input, context)` pattern. is this a violation?

**analysis:**
- function takes NO inputs (hardcoded `owner: 'ehmpath'`, `key: 'XAI_API_KEY'`)
- no context needed (calls keyrack sdk directly)

this is a zero-arg function. `(input, context)` applies when there ARE inputs.

**verdict:** not applicable. zero-arg functions are acceptable. ✓

### rule.require.arrow-only

**code:**
```typescript
export const getXaiCredsFromKeyrack = async (): Promise<{...}> => {
```

**verdict:** uses arrow function ✓ (no `function` keyword)

### rule.require.clear-contracts

**jsdoc:**
```typescript
/**
 * .what = fetch xai credentials from keyrack with fail-fast semantics
 * .why = xai is the default brain; credentials should come from keyrack, not envvars
 */
```

**return type:** explicitly declared `Promise<{ supplier: ... }>`

**verdict:** clear contract ✓

---

## code.prod/pitofsuccess.errors checks

### rule.require.fail-fast

**code:**
```typescript
if (grant.status === 'locked') {
  console.error(...);
  process.exit(2);
}
```

fail-fast: yes, exits immediately on error ✓
no deep nested blocks: yes, flat if blocks ✓

### rule.require.exit-code-semantics

| status | exit code | semantic |
|--------|-----------|----------|
| locked | 2 | constraint (user must unlock) |
| absent | 2 | constraint (user must add key) |
| blocked | 2 | constraint (permissions issue) |

**verdict:** all constraint errors use exit 2 ✓

### rule.forbid.stdout-on-exit-errors

**code:**
```typescript
console.error('✋ keyrack is locked');
...
process.exit(2);
```

all output to `console.error` (stderr), not `console.log` (stdout) ✓

---

## code.prod/readable.comments checks

### rule.require.what-why-headers

**jsdoc:**
```typescript
/**
 * .what = fetch xai credentials from keyrack with fail-fast semantics
 * .why = xai is the default brain; credentials should come from keyrack, not envvars
 *
 * .note = also sets process.env.XAI_API_KEY for current rhachet compatibility
 */
```

- `.what` present ✓
- `.why` present ✓
- `.note` for caveat ✓

**verdict:** follows jsdoc header standard ✓

---

## code.prod/readable.narrative checks

### rule.forbid.else-branches

**code structure:**
```typescript
if (grant.status === 'granted') {
  ...
  return ...;
}

if (grant.status === 'locked') {
  ...
  process.exit(2);
}

if (grant.status === 'absent') {
  ...
  process.exit(2);
}

if (grant.status === 'blocked') {
  ...
  process.exit(2);
}

// exhaustiveness
```

no `else` branches. flat sequence of `if` blocks with early returns/exits ✓

### rule.require.narrative-flow

code reads as:
1. attempt keyrack fetch
2. if granted → return credentials
3. if locked → fail with unlock instructions
4. if absent → fail with set instructions
5. if blocked → fail with hint
6. exhaustiveness check

**verdict:** clear narrative flow ✓

---

## code.prod/evolvable.repo.structure checks

### rule.require.directional-deps

**imports in getXaiCredsFromKeyrack.ts:**
```typescript
import { type KeyrackGrantAttempt, keyrack } from 'rhachet/keyrack';
import type { BrainSuppliesXai } from 'rhachet-brains-xai';
```

imports from:
- external packages (rhachet, rhachet-brains-xai)
- no imports from higher layers (contract/, etc.)

**verdict:** respects directional deps ✓

### rule.require.sync-filename-opname

- file: `getXaiCredsFromKeyrack.ts`
- export: `getXaiCredsFromKeyrack`

**verdict:** filename matches export ✓

---

## violations found

| rule | violation? | notes |
|------|------------|-------|
| forbid.gerunds | no | all names clean |
| require.treestruct | no | verb-noun pattern |
| require.input-context | n/a | zero-arg function |
| require.arrow-only | no | arrow function used |
| require.fail-fast | no | immediate exit on error |
| require.exit-codes | no | all use exit 2 |
| forbid.stdout-on-exit | no | all to stderr |
| require.what-why | no | jsdoc present |
| forbid.else | no | flat if sequence |
| require.directional | no | clean imports |
| require.sync-filename | no | matches |

**violations found:** none.

---

## final assessment (r6)

all mechanic role standards adhered to:
- clear names with treestruct pattern
- arrow function with typed return
- fail-fast with exit code 2
- stderr for error output
- jsdoc with .what/.why
- no else branches
- clean directional imports

code follows mechanic practices.

