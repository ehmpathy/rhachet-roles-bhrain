# self-review: has-consistent-mechanisms (r2)

## stone: 5.1.execution.phase0_to_phaseN.v1

---

## second pass — fresh eyes

cleared my mind. re-read the code from scratch. asked: did we duplicate extant mechanisms?

---

## mechanism 1: keyrack sdk usage

**what we wrote:**
```typescript
const grant = (await keyrack.get({
  for: { key: 'XAI_API_KEY' },
  owner: 'ehmpath',
})) as KeyrackGrantAttempt;
```

**is there an extant pattern?**

searched for `keyrack.get` across the codebase. found:
- no other usages in this repo

searched in rhachet-roles-ehmpathy for keyrack patterns:
- mechanic role uses keyrack for github tokens
- same `keyrack.get()` api with `for: { key }` and `owner` params

**verdict:** consistent with extant patterns in peer repos.

---

## mechanism 2: fail-fast with process.exit(2)

**what we wrote:**
```typescript
if (grant.status === 'locked') {
  console.error('...');
  process.exit(2);
}
```

**is there an extant pattern?**

searched for `process.exit(2)` in this repo:
- `review.cli.ts`: uses `process.exit(2)` for constraint errors
- `reflect.cli.ts`: uses `process.exit(2)` for constraint errors

exit code 2 = constraint error (user must fix). consistent with rule.require.exit-code-semantics.

**verdict:** consistent with extant exit code semantics.

---

## mechanism 3: error message format

**what we wrote:**
```typescript
console.error('');
console.error('🦉 patience, friend');
console.error('');
console.error('✋ keyrack is locked');
console.error('   ├─ owner: ehmpath');
console.error('   └─ run: rhx keyrack unlock --owner ehmpath --prikey ~/.ssh/ehmpath --env all');
console.error('');
```

**is there an extant pattern?**

searched for error output patterns:
- owl vibe (🦉) is consistent with bhrain owl persona
- treestruct format (├─, └─) is consistent with cli output briefs
- actionable command suggestion is consistent with ergonomist briefs

**verdict:** consistent with extant error message patterns.

---

## mechanism 4: supplier pattern

**what we wrote:**
```typescript
return {
  supplier: {
    'brain.supplier.xai': {
      creds: async () => ({ XAI_API_KEY: apiKey }),
    },
  },
};
```

**is there an extant pattern?**

this matches the `BrainSuppliesXai` type from rhachet-brains-xai exactly.

searched for supplier patterns in this repo:
- no other supplier usages (this is new functionality)

**verdict:** consistent with rhachet-brains-xai contract.

---

## mechanism 5: xai brain detection

**what we wrote:**
```typescript
const isXaiBrain = options.brain.startsWith('xai/');
```

**is there an extant pattern?**

searched for brain detection patterns:
- no prior xai-specific detection in this repo
- this is the first xai-specific behavior

**is the prefix check appropriate?**

xai brain slugs follow pattern: `xai/grok/code-fast-1`, `xai/grok/vision-beta`.
prefix check `startsWith('xai/')` correctly matches all xai brains.

**verdict:** appropriate for scope. no duplication.

---

## did we reinvent wheels?

| potential duplication | analysis | verdict |
|-----------------------|----------|---------|
| keyrack wrapper | no extant wrapper in repo | new, not duplicate |
| error formatter | extant patterns followed | consistent |
| exit handler | extant semantics used | consistent |
| credential supplier | matches xai brain contract | consistent |

**no wheels reinvented.** all mechanisms either:
1. are new (first keyrack usage in repo)
2. follow extant patterns (exit codes, error format)
3. match external contracts (keyrack sdk, brain supplier)

---

## final assessment

searched for duplicated mechanisms:

| mechanism | duplicates extant? | verdict |
|-----------|-------------------|---------|
| keyrack.get() | no, first usage | keep |
| process.exit(2) | no, follows extant | keep |
| error treestruct | no, follows extant | keep |
| supplier return | no, matches contract | keep |
| xai prefix check | no, first xai-specific | keep |

**mechanisms that duplicate extant functionality:** none found.

all new code either introduces new capability (keyrack) or follows extant patterns (exit codes, error format).

