# self-review: behavior-declaration-adherance (r5)

## stone: 5.1.execution.phase0_to_phaseN.v1

---

## fifth pass — adherance verification

coverage confirmed what IS implemented. adherance confirms it's implemented CORRECTLY.

---

## vision adherance

### vision says: "fail-fast with actionable instructions"

**blueprint specifies error message format:**
```
🦉 patience, friend

✋ keyrack is locked
   ├─ owner: ehmpath
   └─ run: rhx keyrack unlock --owner ehmpath --prikey ~/.ssh/ehmpath --env all
```

**code says (locked):**
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

**adherance check:**
- owl emoji (🦉): matches
- hand emoji (✋): matches
- treestruct (├─, └─): matches
- owner line: matches
- command: matches exactly

**verdict:** adheres to blueprint.

### vision says: "exit code 2 for constraint errors"

**code:**
```typescript
process.exit(2);
```

**adherance check:** correct exit code per rule.require.exit-code-semantics.

**verdict:** adheres to spec.

---

## criteria adherance

### criteria usecase.4: "keyrack is NOT consulted for non-xai brains"

**code:**
```typescript
const isXaiBrain = options.brain.startsWith('xai/');
if (isXaiBrain) {
  await getXaiCredsFromKeyrack();
}
```

**adherance check:**

the condition is `if (isXaiBrain)`. for non-xai brains:
- `options.brain = 'anthropic/claude-3'`
- `isXaiBrain = 'anthropic/claude-3'.startsWith('xai/')` = `false`
- block is skipped

**verdict:** adheres to criteria. keyrack not called for non-xai.

### criteria boundary: "key in envvar but not vault"

**spec says:** keyrack handles envvar passthrough internally.

**code:**
```typescript
const grant = (await keyrack.get({
  for: { key: 'XAI_API_KEY' },
  owner: 'ehmpath',
})) as KeyrackGrantAttempt;
```

**adherance check:**

we call `keyrack.get()` and trust it to handle envvar passthrough. we do NOT add our own fallback like:
```typescript
// we did NOT write this
const apiKey = keyrackResult ?? process.env.XAI_API_KEY;
```

**verdict:** adheres to spec. keyrack handles passthrough, not our code.

---

## blueprint adherance

### blueprint: keyrack.yml format

**blueprint says:**
```yaml
org: ehmpath

env.all:
  - XAI_API_KEY
```

**code says (keyrack.yml):**
```yaml
org: ehmpath

env.all:
  - XAI_API_KEY
```

**verdict:** exact match.

### blueprint: getXaiCredsFromKeyrack signature

**blueprint says:**
```typescript
export const getXaiCredsFromKeyrack = async (): Promise<{
  supplier: { 'brain.supplier.xai': BrainSuppliesXai };
}>
```

**code says:**
```typescript
export const getXaiCredsFromKeyrack = async (): Promise<{
  supplier: { 'brain.supplier.xai': BrainSuppliesXai };
}> => {
```

**verdict:** signature matches blueprint.

### blueprint: review.ts integration

**blueprint says:**
```typescript
const isXaiBrain = (options.brain ?? DEFAULT_BRAIN).startsWith('xai/');
```

**code says:**
```typescript
const isXaiBrain = options.brain.startsWith('xai/');
```

**difference:** blueprint includes `?? DEFAULT_BRAIN` fallback.

**is this a deviation?**

checked: `options.brain` already has a default value set by `parseArgs`:
```typescript
// in parseArgs, brain has default
brain: argv.brain ?? 'xai/grok/code-fast-1',
```

so `options.brain` is never undefined. the `?? DEFAULT_BRAIN` in blueprint was redundant.

**verdict:** implementation is correct. blueprint had unnecessary null check.

### blueprint: supplier usage

**blueprint says:**
```typescript
let supplier: { 'brain.supplier.xai': BrainSuppliesXai } | undefined;
if (isXaiBrain) {
  const keyrackResult = await getXaiCredsFromKeyrack();
  supplier = keyrackResult.supplier;
}

const brain = await genContextBrain({
  choice: options.brain,
  supplier,
});
```

**code says:**
```typescript
if (isXaiBrain) {
  await getXaiCredsFromKeyrack();
}

const brain = await genContextBrain({ choice: options.brain });
```

**difference:** blueprint passes `supplier` to `genContextBrain`, code does not.

**is this a deviation?**

research showed: `genContextBrain` doesn't accept or use `supplier` param. the blueprint assumption was incorrect.

the workaround (set `process.env.XAI_API_KEY`) is documented in jsdoc and achieves the same goal: credentials reach the xai brain.

**verdict:** implementation deviates from blueprint letter but adheres to spirit. workaround documented and necessary.

---

## deviations found

| deviation | severity | reason |
|-----------|----------|--------|
| no `?? DEFAULT_BRAIN` | none | parseArgs already defaults |
| supplier not passed to genContextBrain | workaround | genContextBrain doesn't support it |

**neither deviation is a bug.** both are correct adaptations to discovered constraints.

---

## final assessment (r5)

| spec element | adheres? | notes |
|--------------|----------|-------|
| error message format | yes | exact match |
| exit code 2 | yes | constraint error semantic |
| xai-only detection | yes | prefix check correct |
| non-xai bypass | yes | block skipped |
| envvar passthrough | yes | delegated to keyrack sdk |
| keyrack.yml format | yes | exact match |
| function signature | yes | matches blueprint |
| review.ts integration | yes | minor simplification (no redundant null check) |
| supplier workaround | documented | genContextBrain limitation |

**adherance status:** all spec requirements adhered to. deviations are documented improvements or necessary workarounds.

