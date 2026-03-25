# self-review: has-behavior-declaration-coverage (r7)

## stone: 3.3.1.blueprint.product.v1

---

## r7: line-by-line wish coverage

took a breath. re-read the wish word by word. checked every phrase against the blueprint.

---

## wish line 1

> "upgrade the review skill to pull XAI_API_KEY from `rhx keyrack`"

**blueprint coverage**:

```typescript
// getXaiCredsFromKeyrack.ts
const grant = await getKeyrackKeyGrant({
  owner: 'ehmpath',
  key: 'XAI_API_KEY',
});
```

**how it's covered**: `getKeyrackKeyGrant` is the keyrack sdk function. it pulls `XAI_API_KEY`.

**verdict**: covered.

---

## wish line 2

> "rather than depend on envvars"

**blueprint coverage**:

```typescript
// review.ts changes
if (isXaiBrain) {
  const keyrackResult = await getXaiCredsFromKeyrack();
  supplier = keyrackResult.supplier;
}
```

**how it's covered**: for xai brains, we call keyrack instead of envvars directly. the supplier pattern injects credentials.

**what about envvar fallback?**: the wish says "rather than depend on envvars" — but usecase.6 says keyrack handles envvar passthrough internally. this is not a contradiction: we call keyrack (not envvar directly), and keyrack does the passthrough.

**verdict**: covered.

---

## wish line 3

> "and pass it in through the upgraded rhachet-brains-xai context, that accepts these creds"

**blueprint coverage**:

```typescript
supplier: {
  'brain.supplier.xai': {
    creds: async () => ({ XAI_API_KEY: grant.value }),
  },
},
```

**how it's covered**: we create a supplier that matches `BrainSuppliesXai` interface. we pass it to `genContextBrain({ supplier })`.

**verdict**: covered.

---

## wish line 4

> "and failfast if the `rhx keyrack` cant find those creds under the `--ehmpath` owner"

**blueprint coverage**:

```typescript
if (grant.status === 'locked') {
  console.error('✋ keyrack is locked');
  process.exit(2);
}

if (grant.status === 'absent') {
  console.error('✋ XAI_API_KEY not found in keyrack');
  process.exit(2);
}

if (grant.status === 'blocked') {
  console.error('✋ keyrack access blocked');
  process.exit(2);
}
```

**how it's covered**: every non-granted status triggers immediate exit with error message.

**note**: the wish says `--ehmpath` owner. the blueprint uses `owner: 'ehmpath'`. consistent.

**verdict**: covered.

---

## wish line 5

> "only add this support for XAI_API_KEY for now, specifically when we detect that the brain is from xai"

**blueprint coverage**:

```typescript
const isXaiBrain = (options.brain ?? DEFAULT_BRAIN).startsWith('xai/');
if (isXaiBrain) {
  // only xai brains
}
```

**how it's covered**: keyrack integration is conditional on xai brain detection.

**verdict**: covered.

---

## wish line 6

> "this repo is from ehmpathy, so we feel comfortable requesting creds from the `--ehmpath` owner"

**blueprint coverage**:

```typescript
const grant = await getKeyrackKeyGrant({
  owner: 'ehmpath',  // hardcoded per wish
  key: 'XAI_API_KEY',
});
```

**how it's covered**: `owner: 'ehmpath'` is hardcoded as the wish allows.

**verdict**: covered.

---

## wish line 7

> "we should also try and unlock the `--ehmpath` keyrack if its not already unlocked"

**wait**: this says "try and unlock". but the vision says "cli does NOT try to unlock; just fail-fast with instructions."

**investigation**: re-read the vision:
> "cli does NOT try to unlock; just fail-fast with instructions"

**reconciliation**: the vision was settled after the wish. the vision says no auto-unlock. the blueprint follows the vision.

**blueprint coverage**:
```typescript
if (grant.status === 'locked') {
  console.error('   └─ run: rhx keyrack unlock --owner ehmpath --prikey ~/.ssh/ehmpath --env all');
  process.exit(2);
}
```

**how it's covered**: we show instructions, not auto-unlock. this follows the settled vision.

**verdict**: covered (per settled vision).

---

## wish line 8

> "add a keyrack to the reviewer role, so that when folks init their keyrack with this role, they extend this roles keyrack, and know that XAI_API_KEY is required to be filled in"

**blueprint coverage**:

```yaml
# keyrack.yml
org: ehmpath

env.all:
  - XAI_API_KEY
```

**how it's covered**: the role manifest declares `XAI_API_KEY` under `env.all`. when users init with this role, they see the requirement.

**verdict**: covered.

---

## wish line 9

> "lookup the docs from rhachet on keyrack, the docs from rhachet-roles-ehmpathy on how to declare a role grain keyrack (e.g., check getMechanicRole), and the docs on rhachet-brains-xai to learn how it gets creds from context"

**this is research guidance, not a requirement**. the research was done in earlier stones.

**verdict**: n/a (guidance, not requirement).

---

## wish line 10

> "remember, you'll want to unlock the keyrack before the get is workable"

**this is implementation guidance**. the blueprint handles locked status with fail-fast.

**verdict**: n/a (guidance, not requirement).

---

## wish line 11

> "and because we expect only ehmpaths to work with this role for now, its fine to unlock from --ehmpath owner and get the key from them"

**blueprint coverage**: `owner: 'ehmpath'` is hardcoded.

**verdict**: covered.

---

## wish line 12

> "envvars will still work for any other creds required as usual, e.g., if they want to use a different brain"

**blueprint coverage**:

```typescript
const isXaiBrain = (options.brain ?? DEFAULT_BRAIN).startsWith('xai/');
if (isXaiBrain) {
  // keyrack only for xai
}
// non-xai brains: genContextBrain uses envvars as before
```

**how it's covered**: non-xai brains skip keyrack entirely. they use envvars via `genContextBrain` as before.

**verdict**: covered.

---

## wish line 13

> "but cause xai is the default brain, we need to specify that by default they need this in their keyrack"

**blueprint coverage**:

```yaml
env.all:
  - XAI_API_KEY
```

**how it's covered**: role manifest declares the requirement. xai is the default, so this is always needed.

**verdict**: covered.

---

## criteria usecases

### usecase.1: happy path
| criterion | blueprint location |
|-----------|-------------------|
| review completes | `genContextBrain({ supplier })` → `stepReview` |
| credentials fetched from keyrack | `getKeyrackKeyGrant({ owner: 'ehmpath', key: 'XAI_API_KEY' })` |
| credentials passed to brain | `supplier: { 'brain.supplier.xai': { creds: ... } }` |

### usecase.2: locked keyrack
| criterion | blueprint location |
|-----------|-------------------|
| fails immediately | `process.exit(2)` |
| error shows unlock command | `run: rhx keyrack unlock --owner ehmpath --prikey ~/.ssh/ehmpath --env all` |

### usecase.3: absent key
| criterion | blueprint location |
|-----------|-------------------|
| fails immediately | `process.exit(2)` |
| error shows set command | `run: rhx keyrack set --owner ehmpath --key XAI_API_KEY` |

### usecase.4: non-xai brain
| criterion | blueprint location |
|-----------|-------------------|
| keyrack NOT consulted | `if (isXaiBrain)` guard |
| envvars used as usual | `genContextBrain` without supplier |

### usecase.5: role init
| criterion | blueprint location |
|-----------|-------------------|
| shows XAI_API_KEY required | `keyrack.yml` declares it |

### usecase.6: envvar passthrough
| criterion | blueprint location |
|-----------|-------------------|
| review completes | sdk handles passthrough |
| keyrack handles lookup | `getKeyrackKeyGrant` does passthrough internally |

---

## gaps found

none. every wish line is addressed. every usecase criterion is satisfied.

---

## conclusion

the blueprint provides complete coverage of the behavior declaration. no requirements were omitted.

