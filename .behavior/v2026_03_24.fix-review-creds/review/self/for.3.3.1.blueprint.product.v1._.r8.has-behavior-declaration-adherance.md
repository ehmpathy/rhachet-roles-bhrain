# self-review: has-behavior-declaration-adherance (r8)

## stone: 3.3.1.blueprint.product.v1

---

## r8: exhaustive adherence verification

took a breath. went through the blueprint with fresh eyes. verified every detail.

---

## section 1: function signature

**blueprint proposes**:
```typescript
export const getXaiCredsFromKeyrack = async (): Promise<{
  supplier: { 'brain.supplier.xai': BrainSuppliesXai };
}> => { ... }
```

**spec verification**:

1. **return type**: `Promise<{ supplier: ... }>`

   **why it's correct**: the vision says credentials should be passed via `context['brain.supplier.xai']`. this return type provides exactly that structure.

2. **no input parameters**

   **why it's correct**: the owner ('ehmpath') and key ('XAI_API_KEY') are hardcoded per the wish. no configuration needed.

3. **async function**

   **why it's correct**: `getKeyrackKeyGrant` is async (calls keyrack sdk). the wrapper must also be async.

**verdict**: adheres.

---

## section 2: keyrack sdk call

**blueprint proposes**:
```typescript
const grant = await getKeyrackKeyGrant({
  owner: 'ehmpath',
  key: 'XAI_API_KEY',
});
```

**spec verification**:

1. **owner: 'ehmpath'**

   **wish says**: "under the `--ehmpath` owner"

   **vision says**: "scoped to ehmpathy... `--owner ehmpath`"

   **verification**: `'ehmpath'` matches the wish and vision.

2. **key: 'XAI_API_KEY'**

   **wish says**: "pull XAI_API_KEY from `rhx keyrack`"

   **verification**: `'XAI_API_KEY'` matches the wish exactly.

3. **getKeyrackKeyGrant**

   **research confirmed**: this is the correct rhachet sdk function.

   **verification**: the correct sdk function is used.

**verdict**: adheres.

---

## section 3: granted status handler

**blueprint proposes**:
```typescript
if (grant.status === 'granted') {
  return {
    supplier: {
      'brain.supplier.xai': {
        creds: async () => ({ XAI_API_KEY: grant.value }),
      },
    },
  };
}
```

**spec verification**:

1. **supplier key: 'brain.supplier.xai'**

   **rhachet-brains-xai research**: the context key is `'brain.supplier.xai'`.

   **verification**: matches the external api.

2. **creds function signature**

   **rhachet-brains-xai research**: `creds: () => Promise<{ XAI_API_KEY: string }>`

   **blueprint provides**: `creds: async () => ({ XAI_API_KEY: grant.value })`

   **verification**: `async () => (...)` returns a Promise. `{ XAI_API_KEY: grant.value }` matches the shape.

3. **grant.value access**

   **keyrack sdk research**: when status is 'granted', `grant.value` contains the secret.

   **verification**: correct property access.

**verdict**: adheres.

---

## section 4: locked status handler

**blueprint proposes**:
```typescript
if (grant.status === 'locked') {
  console.error('');
  console.error('🦉 patience, friend');
  console.error('');
  console.error('✋ keyrack is locked');
  console.error('   ├─ owner: ehmpath');
  console.error('   └─ run: rhx keyrack unlock --owner ehmpath --prikey ~/.ssh/ehmpath --env all');
  console.error('');
  process.exit(2);
}
```

**spec verification**:

1. **fail-fast requirement**

   **wish says**: "failfast if the `rhx keyrack` cant find those creds"

   **vision says**: "fail-fast with actionable instructions if locked"

   **verification**: `process.exit(2)` immediately exits. fail-fast satisfied.

2. **error message content**

   **criteria usecase.2**: "error includes `rhx keyrack unlock --owner ehmpath`"

   **blueprint provides**: `rhx keyrack unlock --owner ehmpath --prikey ~/.ssh/ehmpath --env all`

   **verification**: includes the required command. adds helpful details (prikey, env).

3. **exit code**

   **rule.require.exit-code-semantics**: exit 2 = constraint (user must fix)

   **verification**: locked keyrack is a constraint. exit 2 is correct.

4. **output goes to stderr**

   **rule.forbid.stdout-on-exit-errors**: errors before exit must go to stderr

   **verification**: uses `console.error`, not `console.log`.

**verdict**: adheres.

---

## section 5: absent status handler

**blueprint proposes**:
```typescript
if (grant.status === 'absent') {
  console.error('');
  console.error('🦉 patience, friend');
  console.error('');
  console.error('✋ XAI_API_KEY not found in keyrack');
  console.error('   ├─ owner: ehmpath');
  console.error('   └─ run: rhx keyrack set --owner ehmpath --key XAI_API_KEY');
  console.error('');
  process.exit(2);
}
```

**spec verification**:

1. **fail-fast requirement**: satisfied (process.exit(2))

2. **error message content**

   **criteria usecase.3**: "error includes `rhx keyrack set --owner ehmpath --key XAI_API_KEY`"

   **verification**: exact match.

3. **exit code**: 2 (constraint). correct.

4. **output to stderr**: `console.error`. correct.

**verdict**: adheres.

---

## section 6: blocked status handler

**blueprint proposes**:
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

**spec verification**:

1. **keyrack sdk research**: 'blocked' is a valid status (permissions issue)

2. **fail-fast**: satisfied

3. **error message**: provides actionable hint

4. **exit code**: 2 (constraint). correct.

**verdict**: adheres.

---

## section 7: exhaustiveness check

**blueprint proposes**:
```typescript
const _exhaustive: never = grant;
throw new Error(`unexpected grant status: ${JSON.stringify(_exhaustive)}`);
```

**spec verification**:

this is a TypeScript pattern for compile-time exhaustiveness. if the keyrack sdk adds a new status, this will cause a compile error.

**why it's correct**: prevents silent failure on unknown statuses. follows fail-fast principle.

**verdict**: adheres to safe code practices.

---

## section 8: review.ts changes

**blueprint proposes**:
```typescript
const isXaiBrain = (options.brain ?? DEFAULT_BRAIN).startsWith('xai/');

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

**spec verification**:

1. **xai detection**

   **wish says**: "specifically when we detect that the brain is from xai"

   **vision says**: "when brain slug starts with `xai/`"

   **verification**: `startsWith('xai/')` matches the vision exactly.

2. **default brain check**

   **wish says**: "xai is the default brain"

   **verification**: `options.brain ?? DEFAULT_BRAIN` handles default case.

3. **conditional keyrack call**

   **criteria usecase.4**: "keyrack is NOT consulted for non-xai brains"

   **verification**: `if (isXaiBrain)` guards the keyrack call.

4. **supplier passed to genContextBrain**

   **rhachet research**: `genContextBrain` accepts optional `supplier` parameter

   **verification**: `supplier` is passed correctly.

**verdict**: adheres.

---

## section 9: keyrack.yml

**blueprint proposes**:
```yaml
org: ehmpath

env.all:
  - XAI_API_KEY
```

**spec verification**:

1. **org field**

   **rhachet research**: role manifests use `org:` for keyrack owner

   **wish says**: "from the `--ehmpath` owner"

   **verification**: `org: ehmpath` matches.

2. **env.all field**

   **rhachet research**: `env.all:` lists keys needed in all environments

   **wish says**: "know that XAI_API_KEY is required"

   **verification**: `- XAI_API_KEY` declares the requirement.

**verdict**: adheres.

---

## cross-check concerns

### concern 1: no auto-unlock

**vision settled**: "cli does NOT try to unlock; just fail-fast with instructions"

**blueprint verification**: no `await unlockKeyrack()` or similar. only shows instructions.

**verdict**: adheres.

### concern 2: envvar passthrough

**vision settled**: "keyrack handles envvar passthrough internally — we only call keyrack"

**blueprint verification**: no `process.env.XAI_API_KEY` fallback in the blueprint. keyrack sdk handles it.

**verdict**: adheres.

---

## conclusion

every line of the blueprint has been verified against the behavior declaration. all sections adhere to the vision, criteria, and relevant rules.

