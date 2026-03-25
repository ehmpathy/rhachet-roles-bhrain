# self-review: has-consistent-mechanisms (r4)

## stone: 3.3.1.blueprint.product.v1

---

## r4: search for extant mechanisms

paused. searched the codebase for related patterns.

---

## search results

### keyrack-related patterns

```bash
grep 'getKeyrackKeyGrant|keyrack' *.ts
# result: no files found
```

no extant keyrack integration in this codebase. `getXaiCredsFromKeyrack` would be the first.

---

### error message patterns

```bash
grep 'patience' src/*.ts
# result: found in src/contract/cli/route.ts
```

extant pattern:
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
```

blueprint proposes:
```typescript
console.error('');
console.error('🦉 patience, friend');
console.error('');
console.error('✋ keyrack is locked');
console.error('   ├─ owner: ehmpath');
console.error('   └─ run: rhx keyrack unlock --owner ehmpath --prikey ~/.ssh/ehmpath --env all');
```

**analysis**: same vibe (`🦉 patience, friend`), same tree structure (`├─`, `└─`). consistent.

---

### exit code patterns

```bash
grep 'process\.exit\(2\)' src/*.ts
# result: found in route.ts, review.ts, research.ts
```

extant pattern: `process.exit(2)` for constraint errors (user must fix).

blueprint proposes: `process.exit(2)` for keyrack errors.

**analysis**: consistent with extant semantic. exit code 2 = constraint error.

---

### genContextBrain patterns

```bash
grep 'genContextBrain' src/*.ts
```

extant usage:
```typescript
// review.ts line 183
const brain = await genContextBrain({ choice: options.brain });

// reflect.ts line 142
const brain = await genContextBrain({ choice: options.brain });
```

blueprint proposes:
```typescript
const brain = await genContextBrain({
  choice: options.brain,
  supplier,
});
```

**analysis**: adds optional `supplier` parameter. this is consistent with how genContextBrain accepts suppliers (per rhachet sdk docs).

---

### supplier pattern

```bash
grep 'brain\.supplier' src/*.ts
# result: no files found
```

no extant supplier usage in this codebase. the blueprint introduces it per the rhachet-brains-xai contract.

**analysis**: not a duplication — this is new functionality per the wish.

---

## mechanism-by-mechanism review

| mechanism | extant? | action |
|-----------|---------|--------|
| `getXaiCredsFromKeyrack.ts` | no | new — required by wish |
| `keyrack.yml` | no | new — required by wish |
| error message format | yes | consistent with route.ts pattern |
| exit code 2 | yes | consistent with extant semantics |
| supplier pattern | no | new — per rhachet-brains-xai contract |
| `genContextBrain({ supplier })` | partial | extends extant call with new param |

---

## potential duplications

### could we reuse an extant credential operation?

**search**: no extant credential operations found. `getXaiCredsFromKeyrack` is the first.

**verdict**: no duplication.

### could we reuse an extant fail-fast pattern?

**search**: extant patterns use inline console.error + process.exit(2).

**analysis**: the blueprint uses the same inline pattern. no extraction needed — it would be over-abstraction for a single use case.

**verdict**: consistent with extant approach.

### could we reuse an extant keyrack wrapper?

**search**: no extant keyrack wrappers in this codebase.

**verdict**: no duplication.

---

## open questions

none. all new mechanisms are either:
1. required by wish (keyrack integration, supplier pattern)
2. consistent with extant patterns (error format, exit codes)

---

## conclusion

no extant mechanisms are duplicated. all new mechanisms are either novel (per wish) or consistent with established patterns.

