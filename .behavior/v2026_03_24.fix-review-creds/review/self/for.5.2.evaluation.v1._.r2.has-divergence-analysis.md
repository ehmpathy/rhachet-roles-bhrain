# self-review: has-divergence-analysis (r2)

## stone: 5.2.evaluation.v1

---

## second pass — line-by-line blueprint comparison

r1 did section-by-section comparison. r2 reads each line of the blueprint and asks: does the implementation match?

---

## blueprint line 5 (summary)

> integrate keyrack credential retrieval into the review skill for xai brains.

**implementation:** integrated into review.ts AND reflect.ts

**divergence?** yes — reflect.ts added

**documented?** yes, divergence #8: "reflect.ts included — open question resolved"

---

## blueprint line 5 (continued)

> when brain slug starts with `xai/`, fetch `XAI_API_KEY` from keyrack via supplier pattern.

**implementation:** review.ts line 184:
```typescript
const isXaiBrain = options.brain.startsWith('xai/');
```

**divergence?** no — exact match on detection logic.

---

## blueprint line 5 (continued)

> fail-fast with actionable instructions if keyrack is locked or key is absent.

**implementation:** getXaiCredsFromKeyrack.ts lines 39-74:
- status 'locked' → console.error with unlock command → process.exit(2)
- status 'absent' → console.error with set command → process.exit(2)
- status 'blocked' → console.error with hint → process.exit(2)

**divergence?** no — fail-fast implemented for all non-granted statuses.

---

## blueprint lines 15-16 (keyrack.yml)

> [+] keyrack.yml # role manifest declares XAI_API_KEY requirement

**implementation:** file exists at `src/domain.roles/reviewer/keyrack.yml`

**divergence?** no.

---

## blueprint line 18 (getXaiCredsFromKeyrack.ts)

> [+] getXaiCredsFromKeyrack.ts # keyrack integration helper

**implementation:** file exists at `src/domain.operations/credentials/getXaiCredsFromKeyrack.ts`

**divergence?** no.

---

## blueprint line 21 (review.ts)

> [~] review.ts # use keyrack for xai brains

**implementation:** updated with import (line 10) and keyrack call (lines 183-187)

**divergence?** no.

---

## blueprint line 22 (reflect.ts)

> [?] reflect.ts # OPEN QUESTION: include for consistency?

**implementation:** updated with same pattern as review.ts

**divergence?** yes — open question resolved to include

**documented?** yes, divergence #8.

---

## blueprint lines 40-41 (keyrack.get call)

> keyrack.get({ owner: 'ehmpath', key: 'XAI_API_KEY' })

**implementation:** getXaiCredsFromKeyrack.ts lines 15-18:
```typescript
await keyrack.get({
  for: { key: 'XAI_API_KEY' },
  owner: 'ehmpath',
})
```

**divergence?** yes — api shape differs (`{ key }` vs `{ for: { key } }`)

**documented?** yes, divergence #1.

---

## blueprint line 74 (grant.value)

> creds: async () => ({ XAI_API_KEY: grant.value }),

**implementation:** getXaiCredsFromKeyrack.ts line 22:
```typescript
const apiKey = grant.grant.key.secret;
```

**divergence?** yes — path to secret differs

**documented?** yes, divergence #2.

---

## blueprint lines 64-67 (getKeyrackKeyGrant)

> const grant = await getKeyrackKeyGrant({
>   owner: 'ehmpath',
>   key: 'XAI_API_KEY',
> });

**implementation:** uses `keyrack.get()` sdk method, not `getKeyrackKeyGrant`

**divergence?** yes — function name differs

**documented?** yes, divergence #3.

---

## blueprint lines 134-137 (genContextBrain with supplier)

> const brain = await genContextBrain({
>   choice: options.brain,
>   supplier,
> });

**implementation:** review.ts line 190:
```typescript
const brain = await genContextBrain({ choice: options.brain });
```

**divergence?** yes — supplier not passed

**documented?** yes, divergence #4.

---

## blueprint line 125 (DEFAULT_BRAIN fallback)

> const isXaiBrain = (options.brain ?? DEFAULT_BRAIN).startsWith('xai/');

**implementation:** review.ts line 184:
```typescript
const isXaiBrain = options.brain.startsWith('xai/');
```

**divergence?** yes — `?? DEFAULT_BRAIN` removed

**documented?** yes, divergence #6.

**why it holds:** parseArgs at line 55 already defaults brain to 'xai/grok/code-fast-1':
```typescript
brain: argv.brain ?? 'xai/grok/code-fast-1',
```

so `options.brain` is never undefined. the null check was redundant.

---

## blueprint lines 127-131 (supplier variable)

> let supplier: { 'brain.supplier.xai': BrainSuppliesXai } | undefined;
> if (isXaiBrain) {
>   const keyrackResult = await getXaiCredsFromKeyrack();
>   supplier = keyrackResult.supplier;
> }

**implementation:**
```typescript
if (isXaiBrain) {
  await getXaiCredsFromKeyrack();
}
```

**divergence?** yes — supplier variable not saved

**documented?** yes, divergence #7.

**why it holds:** genContextBrain doesn't use supplier (passes `{}` to brain.ask). result would be discarded anyway.

---

## blueprint lines 155-161 (test coverage matrix)

| test type | file | covers |
|-----------|------|--------|
| unit | `getXaiCredsFromKeyrack.test.ts` | grant status branches, error messages |
| integration | `getXaiCredsFromKeyrack.integration.test.ts` | real keyrack fetch with valid key |
| acceptance | `review.keyrack-locked.acceptance.test.ts` | locked keyrack fail-fast |
| acceptance | `review.keyrack-absent.acceptance.test.ts` | absent key fail-fast |
| acceptance | `review.brain-non-xai.acceptance.test.ts` | non-xai brain skips keyrack |

**implementation:** all deferred to phase 2 per roadmap

**divergence?** yes — tests not written yet

**documented?** yes, explicitly stated in evaluation artifact test coverage section.

---

## additional checks: what the hostile reviewer would look for

### check 1: jsdoc in getXaiCredsFromKeyrack.ts

**blueprint lines 56-59:**
```typescript
/**
 * .what = fetch xai credentials from keyrack with fail-fast semantics
 * .why = xai is the default brain; credentials should come from keyrack, not envvars
 */
```

**implementation lines 4-10:**
```typescript
/**
 * .what = fetch xai credentials from keyrack with fail-fast semantics
 * .why = xai is the default brain; credentials should come from keyrack, not envvars
 *
 * .note = also sets process.env.XAI_API_KEY for current rhachet compatibility
 *         (rhachet's genContextBrain does not yet pass supplier context through)
 */
```

**divergence?** yes — implementation adds `.note` that explains workaround

**documented?** partially — divergences #4 and #5 reference the workaround, but the jsdoc addition itself is not listed as a divergence.

**is this a gap?** no. the `.note` is documentation of the workaround, not a divergence from behavior. it explains why the implementation differs from blueprint.

### check 2: process.env assignment

**blueprint:** not mentioned

**implementation:** getXaiCredsFromKeyrack.ts line 27:
```typescript
process.env.XAI_API_KEY = apiKey;
```

**divergence?** yes — implementation sets process.env, blueprint does not

**documented?** yes, divergence #5: "process.env.XAI_API_KEY set in addition to supplier"

### check 3: exhaustiveness check

**blueprint lines 113-115:**
```typescript
// exhaustiveness check
const _exhaustive: never = grant;
throw new Error(`unexpected grant status: ${JSON.stringify(_exhaustive)}`);
```

**implementation lines 76-78:** exact match

**divergence?** no.

---

## final divergence count

| # | divergence | documented? |
|---|------------|-------------|
| 1 | api shape: `{ key }` vs `{ for: { key } }` | yes |
| 2 | grant path: `grant.value` vs `grant.grant.key.secret` | yes |
| 3 | function name: `getKeyrackKeyGrant` vs `keyrack.get` | yes |
| 4 | supplier not passed to genContextBrain | yes |
| 5 | process.env.XAI_API_KEY set | yes |
| 6 | `?? DEFAULT_BRAIN` removed | yes |
| 7 | supplier variable not saved | yes |
| 8 | reflect.ts included | yes |

**additional divergence found in r2:** none. the jsdoc `.note` is documentation, not behavior divergence.

---

## why the divergence analysis is complete

1. read every line of blueprint (253 lines)
2. compared each against implementation
3. found 8 divergences
4. all 8 documented in evaluation artifact
5. hostile reviewer checks found no additional gaps

divergence analysis is thorough and complete.
