# self-review: has-divergence-analysis (r1)

## stone: 5.2.evaluation.v1

---

## first pass — skeptical divergence hunt

what would a hostile reviewer find that I overlooked?

---

## section-by-section comparison

### section: summary

**blueprint says:**
> integrate keyrack credential retrieval into the review skill for xai brains. when brain slug starts with `xai/`, fetch `XAI_API_KEY` from keyrack via supplier pattern. fail-fast with actionable instructions if keyrack is locked or key is absent.

**implementation says:**
> integrated keyrack credential retrieval into the review and reflect skills for xai brains. when brain slug starts with `xai/`, fetch `XAI_API_KEY` from keyrack via supplier pattern. fails fast with actionable instructions if keyrack is locked or key is absent.

**divergence?**
- blueprint: "review skill"
- implementation: "review and reflect skills"

**documented?** yes, divergence #8 in evaluation: "reflect.ts included — open question resolved"

---

### section: filediff tree

**blueprint says:**
```
src/contract/cli/
├─ [~] review.ts
└─ [?] reflect.ts   # OPEN QUESTION
```

**implementation says:**
```
src/contract/cli/
├─ [~] review.ts
└─ [~] reflect.ts
```

**divergence?** blueprint had `[?]` open question, implementation has `[~]` updated.

**documented?** yes, divergence #8.

---

### section: codepath tree

**blueprint says:**
```
keyrack.get({ owner: 'ehmpath', key: 'XAI_API_KEY' })
```

**implementation says:**
```
keyrack.get({ owner: 'ehmpath', for: { key: 'XAI_API_KEY' } })
```

**divergence?** api shape differs: `{ key }` vs `{ for: { key } }`

**documented?** yes, divergence #1.

---

**blueprint says:**
```
grant.value
```

**implementation says:**
```
grant.grant.key.secret
```

**divergence?** path to secret differs.

**documented?** yes, divergence #2.

---

**blueprint says:**
```
getKeyrackKeyGrant({ owner, key })
```

**implementation says:**
```
keyrack.get({ owner, for: { key } })
```

**divergence?** function name differs: `getKeyrackKeyGrant` vs `keyrack.get`

**documented?** yes, divergence #3.

---

**blueprint says:**
```
genContextBrain({ choice, supplier })
```

**implementation says:**
```
genContextBrain({ choice })
// supplier not passed because genContextBrain doesn't use it
// process.env.XAI_API_KEY set instead
```

**divergence?** supplier not passed to genContextBrain.

**documented?** yes, divergences #4 and #5.

---

### section: contracts (review.ts changes)

**blueprint says:**
```typescript
const isXaiBrain = (options.brain ?? DEFAULT_BRAIN).startsWith('xai/');
```

**implementation says:**
```typescript
const isXaiBrain = options.brain.startsWith('xai/');
```

**divergence?** `?? DEFAULT_BRAIN` removed.

**documented?** yes, divergence #6.

---

**blueprint says:**
```typescript
let supplier: { 'brain.supplier.xai': BrainSuppliesXai } | undefined;
if (isXaiBrain) {
  const keyrackResult = await getXaiCredsFromKeyrack();
  supplier = keyrackResult.supplier;
}
```

**implementation says:**
```typescript
if (isXaiBrain) {
  await getXaiCredsFromKeyrack();
}
```

**divergence?** supplier variable not saved, result not used.

**documented?** yes, divergence #7.

---

### section: test coverage

**blueprint says:**
- unit tests for grant status branches
- integration tests
- acceptance tests

**implementation says:**
- all deferred to phase 2

**divergence?** tests deferred.

**documented?** yes, explicitly stated as "deferred to phase 2 per roadmap."

---

## hostile reviewer check

**what divergences might I have missed?**

### check 1: error message format

**blueprint error messages:**
```
🦉 patience, friend

✋ keyrack is locked
   ├─ owner: ehmpath
   └─ run: rhx keyrack unlock --owner ehmpath --prikey ~/.ssh/ehmpath --env all
```

**implementation error messages (from getXaiCredsFromKeyrack.ts lines 40-47):**
```typescript
console.error('');
console.error('🦉 patience, friend');
console.error('');
console.error('✋ keyrack is locked');
console.error('   ├─ owner: ehmpath');
console.error(
  '   └─ run: rhx keyrack unlock --owner ehmpath --prikey ~/.ssh/ehmpath --env all',
);
console.error('');
```

**divergence?** no — exact match.

### check 2: exit codes

**blueprint:** exit 2 for constraint errors

**implementation:** `process.exit(2)` for all error handlers

**divergence?** no — exact match.

### check 3: keyrack.yml format

**blueprint:**
```yaml
org: ehmpath

env.all:
  - XAI_API_KEY
```

**implementation:** exact match.

**divergence?** no.

---

## divergences I might have missed but didn't

1. error message format: checked, no divergence
2. exit codes: checked, no divergence
3. keyrack.yml: checked, no divergence
4. jsdoc headers: not in blueprint, so no divergence possible

---

## final verdict (r1)

| question | answer |
|----------|--------|
| all divergences found? | yes (8 documented) |
| hostile reviewer would find more? | no — checked error messages, exit codes, keyrack.yml |
| each divergence has resolution? | yes — all marked "backup" with rationale |

divergence analysis is complete.
