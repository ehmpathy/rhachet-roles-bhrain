# self-review: behavior-declaration-adherance (r6)

## stone: 5.1.execution.phase0_to_phaseN.v1

---

## sixth pass — character-level verification

r5 checked adherance at the code level. r6 zooms in to check exact strings, exact types, exact semantics.

---

## line-by-line: getXaiCredsFromKeyrack.ts

### line 1-2: imports

**spec (blueprint):**
```typescript
// keyrack sdk import
// BrainSuppliesXai type
```

**code:**
```typescript
import { type KeyrackGrantAttempt, keyrack } from 'rhachet/keyrack';
import type { BrainSuppliesXai } from 'rhachet-brains-xai';
```

**adherance:** correct. imports match what's needed.

### line 4-9: jsdoc

**spec (vision):** document why we set process.env

**code:**
```typescript
/**
 * .what = fetch xai credentials from keyrack with fail-fast semantics
 * .why = xai is the default brain; credentials should come from keyrack, not envvars
 *
 * .note = also sets process.env.XAI_API_KEY for current rhachet compatibility
 *         (rhachet's genContextBrain does not yet pass supplier context through)
 */
```

**adherance:** documented. the `.note` explains the workaround.

### line 15-18: keyrack call

**spec (wish):** "pull XAI_API_KEY from `rhx keyrack`... under the `--ehmpath` owner"

**code:**
```typescript
const grant = (await keyrack.get({
  for: { key: 'XAI_API_KEY' },
  owner: 'ehmpath',
})) as KeyrackGrantAttempt;
```

**adherance check:**
- key: `'XAI_API_KEY'` ✓ matches wish
- owner: `'ehmpath'` ✓ matches wish (`--ehmpath`)

### line 21-36: granted handler

**spec (criteria usecase.1):** "credentials are passed to xai brain"

**code:**
```typescript
if (grant.status === 'granted') {
  const apiKey = grant.grant.key.secret;

  // set in process.env for current rhachet compatibility
  process.env.XAI_API_KEY = apiKey;

  // return supplier for future compatibility
  return {
    supplier: {
      'brain.supplier.xai': {
        creds: async () => ({ XAI_API_KEY: apiKey }),
      },
    },
  };
}
```

**adherance check:**
- extracts `grant.grant.key.secret` ✓ correct path to secret
- sets `process.env.XAI_API_KEY` ✓ workaround for rhachet
- returns supplier shape ✓ matches `BrainSuppliesXai`
- creds function returns `{ XAI_API_KEY: ... }` ✓ correct shape

### line 39-49: locked handler

**spec (criteria usecase.2):** "error includes `rhx keyrack unlock --owner ehmpath`"

**code:**
```typescript
if (grant.status === 'locked') {
  console.error('');
  console.error('🦉 patience, friend');
  console.error('');
  console.error('✋ keyrack is locked');
  console.error('   ├─ owner: ehmpath');
  console.error(
    '   └─ run: rhx keyrack unlock --owner ehmpath --prikey ~/.ssh/ehmpath --env all',
  );
  console.error('');
  process.exit(2);
}
```

**adherance check:**
- contains `rhx keyrack unlock --owner ehmpath` ✓
- exit code 2 ✓ constraint error

### line 52-62: absent handler

**spec (criteria usecase.3):** "error includes `rhx keyrack set --owner ehmpath --key XAI_API_KEY`"

**code:**
```typescript
if (grant.status === 'absent') {
  console.error('');
  console.error('🦉 patience, friend');
  console.error('');
  console.error('✋ XAI_API_KEY not found in keyrack');
  console.error('   ├─ owner: ehmpath');
  console.error(
    '   └─ run: rhx keyrack set --owner ehmpath --key XAI_API_KEY',
  );
  console.error('');
  process.exit(2);
}
```

**adherance check:**
- contains `rhx keyrack set --owner ehmpath --key XAI_API_KEY` ✓
- exit code 2 ✓ constraint error

### line 65-73: blocked handler

**spec (blueprint):** "hint: check keyrack permissions"

**code:**
```typescript
if (grant.status === 'blocked') {
  console.error('');
  console.error('🦉 patience, friend');
  console.error('');
  console.error('✋ keyrack access blocked');
  console.error('   ├─ owner: ehmpath');
  console.error('   └─ hint: check keyrack permissions');
  console.error('');
  process.exit(2);
}
```

**adherance check:**
- contains "hint: check keyrack permissions" ✓
- exit code 2 ✓ constraint error

### line 77-78: exhaustiveness

**spec:** type safety

**code:**
```typescript
const _exhaustive: never = grant;
throw new Error(`unexpected grant status: ${JSON.stringify(_exhaustive)}`);
```

**adherance:** correct pattern for exhaustiveness check.

---

## line-by-line: review.ts integration

### line 10: import

**code:**
```typescript
import { getXaiCredsFromKeyrack } from '@src/domain.operations/credentials/getXaiCredsFromKeyrack';
```

**adherance:** correct import path.

### line 183-187: xai detection and call

**spec (wish):** "specifically when we detect that the brain is from xai"

**code:**
```typescript
// fetch xai credentials from keyrack if xai brain selected
const isXaiBrain = options.brain.startsWith('xai/');
if (isXaiBrain) {
  await getXaiCredsFromKeyrack();
}
```

**adherance check:**
- detection: `startsWith('xai/')` ✓ matches xai brain slugs
- only calls for xai ✓

---

## line-by-line: reflect.ts integration

### line 8: import

**code:**
```typescript
import { getXaiCredsFromKeyrack } from '@src/domain.operations/credentials/getXaiCredsFromKeyrack';
```

**adherance:** correct import path.

### line 144-147: xai detection and call

**code:**
```typescript
// fetch xai credentials from keyrack if xai brain selected
const isXaiBrain = options.brain.startsWith('xai/');
if (isXaiBrain) {
  await getXaiCredsFromKeyrack();
}
```

**adherance:** same pattern as review.ts ✓ consistency maintained.

---

## keyrack.yml verification

**spec (blueprint):**
```yaml
org: ehmpath

env.all:
  - XAI_API_KEY
```

**file content:**
```yaml
org: ehmpath

env.all:
  - XAI_API_KEY
```

**adherance:** exact character-for-character match ✓

---

## semantic verification

### question: is "ehmpath" spelled the same everywhere?

| location | form |
|----------|------|
| getXaiCredsFromKeyrack.ts:17 | `'ehmpath'` |
| getXaiCredsFromKeyrack.ts:44 | `'ehmpath'` |
| getXaiCredsFromKeyrack.ts:57 | `'ehmpath'` |
| getXaiCredsFromKeyrack.ts:70 | `'ehmpath'` |
| keyrack.yml:1 | `ehmpath` |
| vision | `--ehmpath` (flag style) |
| wish | `--ehmpath` (flag style) |

**all consistent.** code uses string `'ehmpath'`, docs use flag `--ehmpath`.

### question: is XAI_API_KEY spelled the same everywhere?

| location | form |
|----------|------|
| getXaiCredsFromKeyrack.ts:16 | `'XAI_API_KEY'` |
| getXaiCredsFromKeyrack.ts:27 | `XAI_API_KEY` (envvar) |
| getXaiCredsFromKeyrack.ts:33 | `XAI_API_KEY` (object key) |
| getXaiCredsFromKeyrack.ts:56 | `'XAI_API_KEY'` (message) |
| getXaiCredsFromKeyrack.ts:59 | `'XAI_API_KEY'` (command) |
| keyrack.yml:4 | `XAI_API_KEY` |

**all consistent.** uppercase with underscores throughout.

---

## final assessment (r6)

| check | result |
|-------|--------|
| keyrack.get() params | exact match to spec |
| error messages | exact match to blueprint |
| exit codes | all 2 (constraint) |
| xai detection | prefix check correct |
| integration points | review.ts and reflect.ts consistent |
| keyrack.yml | character-for-character match |
| term consistency | ehmpath and XAI_API_KEY match everywhere |
| type safety | exhaustiveness check present |

**adherance status:** all spec requirements adhered to at character level. no deviations from spec semantics.

