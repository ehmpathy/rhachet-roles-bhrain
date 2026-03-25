# self-review: has-consistent-mechanisms (r5)

## stone: 3.3.1.blueprint.product.v1

---

## r5: deeper mechanism consistency pass

took a breath. re-read the blueprint. re-read the guide. asked: does this duplicate what already exists?

---

## the blueprint proposes these new mechanisms

1. `getXaiCredsFromKeyrack.ts` — fetch credentials from keyrack
2. `keyrack.yml` — role manifest for credential requirements
3. error message format for keyrack failures
4. exit code semantics for constraint errors
5. supplier pattern for brain credential injection
6. xai brain detection via prefix match

---

## mechanism 1: getXaiCredsFromKeyrack.ts

### what it does

fetches `XAI_API_KEY` from keyrack via `getKeyrackKeyGrant()` and returns a supplier context.

### does the codebase have this already?

**search performed**:
```bash
grep -r 'getKeyrackKeyGrant' src/
# result: no matches

grep -r 'keyrack' src/
# result: no matches

grep -r 'XAI_API_KEY' src/
# result: no matches (outside of test fixtures)
```

**verdict**: no extant keyrack integration. this is the first.

### why it holds

the wish explicitly requests keyrack integration for xai credentials. this cannot be satisfied by any extant mechanism because:
- no extant keyrack code exists in this codebase
- no extant credential fetch exists in this codebase
- the rhachet sdk provides `getKeyrackKeyGrant`, which we call (not duplicate)

---

## mechanism 2: keyrack.yml

### what it does

declares that the reviewer role requires `XAI_API_KEY` under the `ehmpath` org.

### does the codebase have role manifests already?

**search performed**:
```bash
find src/domain.roles -name '*.yml' -o -name '*.yaml'
# result: no yaml files in domain.roles

ls src/domain.roles/
# result: reviewer/ directory exists
```

**verdict**: no extant role manifests. this is the first.

### why it holds

the wish explicitly requests:
> "add a keyrack to the reviewer role, so that when folks init their keyrack with this role, they extend this roles keyrack, and know that XAI_API_KEY is required"

this cannot be satisfied by any extant mechanism because no role manifests exist yet.

---

## mechanism 3: error message format

### what the blueprint proposes

```typescript
console.error('');
console.error('🦉 patience, friend');
console.error('');
console.error('✋ keyrack is locked');
console.error('   ├─ owner: ehmpath');
console.error('   └─ run: rhx keyrack unlock --owner ehmpath --prikey ~/.ssh/ehmpath --env all');
```

### does the codebase have a similar pattern?

**search performed**:
```bash
grep -A10 '🦉 patience' src/contract/cli/route.ts
```

**extant pattern found** (route.ts line 1146):
```typescript
const lines = [
  '🦉 patience, friend',
  '',
  '🗿 route.bounce',
  '   ├─ blocked',
  `   │  ├─ artifact = ${filePath}`,
  `   │  └─ guard = ${path.basename(decision.protection.guard)}`,
  ...
];
console.log(lines.join('\n'));
```

### comparison

| aspect | extant (route.ts) | proposed |
|--------|-------------------|----------|
| owl vibe | `🦉 patience, friend` | `🦉 patience, friend` |
| tree chars | `├─`, `└─`, `│` | `├─`, `└─` |
| output method | console.log | console.error |
| line structure | array + join | sequential calls |

### issue found

the extant pattern uses `console.log` with an array, but the blueprint uses `console.error` with sequential calls.

**is this a problem?**

no. the extant pattern in route.ts outputs to stdout because it's informational. the blueprint outputs to stderr because it's an error condition that leads to `process.exit(2)`.

per `rule.forbid.stdout-on-exit-errors`, error messages before `process.exit(1|2)` must go to stderr.

**verdict**: consistent where it matters (vibe, tree structure). different where appropriate (stderr vs stdout for error conditions).

---

## mechanism 4: exit code semantics

### what the blueprint proposes

exit code 2 for keyrack errors (locked, absent, blocked).

### does the codebase use exit code 2?

**search performed**:
```bash
grep -c 'process.exit(2)' src/contract/cli/*.ts
# result: route.ts (multiple), review.ts (1), research.ts (1)
```

**extant semantics**:
- route.ts uses exit 2 for BadRequestError (constraint)
- review.ts uses exit 2 for validation errors (constraint)
- research.ts uses exit 2 for validation errors (constraint)

**verdict**: consistent. exit 2 = constraint error (user must fix). keyrack errors are constraints.

---

## mechanism 5: supplier pattern

### what the blueprint proposes

```typescript
supplier: {
  'brain.supplier.xai': {
    creds: async () => ({ XAI_API_KEY: grant.value }),
  },
}
```

### does the codebase use suppliers?

**search performed**:
```bash
grep -r 'brain.supplier' src/
# result: no matches

grep -r 'supplier' src/contract/cli/
# result: no matches
```

**verdict**: no extant supplier usage. this is the first.

### why it holds

the supplier pattern is defined by rhachet-brains-xai, not by this codebase. we call an external api, not duplicate internal code.

per research on rhachet-brains-xai:
```typescript
type BrainSuppliesXai = {
  creds: () => Promise<{ XAI_API_KEY: string }>;
};
```

the blueprint implements this interface correctly.

---

## mechanism 6: xai brain detection

### what the blueprint proposes

```typescript
const isXaiBrain = (options.brain ?? DEFAULT_BRAIN).startsWith('xai/');
```

### does the codebase detect brain types?

**search performed**:
```bash
grep -r 'startsWith.*xai' src/
# result: no matches

grep -r 'DEFAULT_BRAIN' src/contract/cli/
# result: found in review.ts, reflect.ts
```

**extant pattern** (review.ts):
```typescript
const DEFAULT_BRAIN = 'xai/grok/code-fast-1';
```

**verdict**: no extant brain type detection. the blueprint adds it, consistent with the fact that DEFAULT_BRAIN starts with `xai/`.

---

## summary table

| mechanism | extant? | duplicates? | action |
|-----------|---------|-------------|--------|
| getXaiCredsFromKeyrack | no | no | new |
| keyrack.yml | no | no | new |
| error format | partial | no | consistent |
| exit code 2 | yes | no | consistent |
| supplier pattern | no | no | new (external api) |
| xai brain detection | no | no | new |

---

## open questions

none found. all mechanisms are either:
1. **new** (required by wish, no extant alternative)
2. **consistent** (follows extant patterns where they exist)

---

## conclusion

no mechanism duplicates extant functionality. all new mechanisms are justified by the wish and consistent with established patterns.

