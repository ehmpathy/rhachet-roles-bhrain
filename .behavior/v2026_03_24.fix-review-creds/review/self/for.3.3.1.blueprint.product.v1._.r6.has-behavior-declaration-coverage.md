# self-review: has-behavior-declaration-coverage (r6)

## stone: 3.3.1.blueprint.product.v1

---

## r6: coverage check against vision and criteria

re-read the vision and criteria. checked each requirement against the blueprint.

---

## vision requirements

### requirement v1: keyrack fetches XAI_API_KEY automatically for xai brains

**vision says**:
> "when brain slug starts with `xai/`, fetch `XAI_API_KEY` from keyrack via supplier pattern"

**blueprint coverage**:
```typescript
const isXaiBrain = (options.brain ?? DEFAULT_BRAIN).startsWith('xai/');
if (isXaiBrain) {
  const keyrackResult = await getXaiCredsFromKeyrack();
  supplier = keyrackResult.supplier;
}
```

**verdict**: covered.

---

### requirement v2: fail-fast with actionable instructions

**vision says**:
> "fail-fast with actionable instructions if keyrack is locked or key is absent"

**blueprint coverage**:
- locked: shows `rhx keyrack unlock --owner ehmpath --prikey ~/.ssh/ehmpath --env all`
- absent: shows `rhx keyrack set --owner ehmpath --key XAI_API_KEY`
- blocked: shows hint about permissions

**verdict**: covered.

---

### requirement v3: role manifest declares credential requirements

**vision says**:
> "add a keyrack to the reviewer role... know that XAI_API_KEY is required"

**blueprint coverage**:
```yaml
org: ehmpath
env.all:
  - XAI_API_KEY
```

**verdict**: covered.

---

### requirement v4: no auto-unlock

**vision says**:
> "cli does NOT try to unlock; just fail-fast with instructions"

**blueprint coverage**:
- no auto-unlock code
- locked status triggers fail-fast with instructions, not auto-unlock

**verdict**: covered.

---

## criteria (usecases)

### usecase.1: review with xai brain (happy path)

**criteria says**:
```
given(keyrack is unlocked for ehmpath owner)
given(XAI_API_KEY is set in keyrack)
  when(user runs `rhx review ...`)
    then(review completes)
    then(credentials are fetched from keyrack)
    then(credentials are passed to xai brain)
```

**blueprint coverage**:
- `getXaiCredsFromKeyrack()` fetches via `getKeyrackKeyGrant`
- `grant.status === 'granted'` → returns supplier
- supplier passed to `genContextBrain({ supplier })`

**verdict**: covered.

---

### usecase.2: review with locked keyrack

**criteria says**:
```
given(keyrack is NOT unlocked)
  when(user runs `rhx review ...`)
    then(review fails immediately)
    then(error includes `rhx keyrack unlock --owner ehmpath`)
```

**blueprint coverage**:
```typescript
if (grant.status === 'locked') {
  console.error('   └─ run: rhx keyrack unlock --owner ehmpath --prikey ~/.ssh/ehmpath --env all');
  process.exit(2);
}
```

**verdict**: covered.

---

### usecase.3: review with absent key

**criteria says**:
```
given(keyrack IS unlocked)
given(XAI_API_KEY is NOT set)
  when(user runs `rhx review ...`)
    then(review fails immediately)
    then(error includes `rhx keyrack set --owner ehmpath --key XAI_API_KEY`)
```

**blueprint coverage**:
```typescript
if (grant.status === 'absent') {
  console.error('   └─ run: rhx keyrack set --owner ehmpath --key XAI_API_KEY');
  process.exit(2);
}
```

**verdict**: covered.

---

### usecase.4: review with non-xai brain

**criteria says**:
```
given(user specifies `--brain anthropic/claude-3`)
  when(user runs `rhx review --brain anthropic/claude-3 ...`)
    then(keyrack is NOT consulted)
    then(envvars are used as usual)
```

**blueprint coverage**:
```typescript
const isXaiBrain = (options.brain ?? DEFAULT_BRAIN).startsWith('xai/');
if (isXaiBrain) {
  // only xai brains hit keyrack
}
```

non-xai brains skip the keyrack block entirely.

**verdict**: covered.

---

### usecase.5: role initialization shows keyrack requirements

**criteria says**:
```
given(reviewer role has keyrack manifest)
  when(user runs `rhx roles init --role reviewer`)
    then(output shows XAI_API_KEY is required)
```

**blueprint coverage**:
- `keyrack.yml` declares `XAI_API_KEY` under `env.all`
- rhachet roles system reads this manifest on init

**note**: the blueprint creates the manifest. the display logic is in rhachet, not this codebase.

**verdict**: covered (manifest exists; display is external).

---

### usecase.6: keyrack envvar passthrough

**criteria says**:
```
given(XAI_API_KEY is NOT in keyrack vault)
given(XAI_API_KEY IS set as envvar)
  when(user runs `rhx review ...`)
    then(review completes)
    then(keyrack handles the envvar lookup internally)
```

**blueprint coverage**:
- per vision: "keyrack handles envvar passthrough internally"
- review code only calls keyrack; keyrack sdk does the passthrough

**note**: this is handled by `getKeyrackKeyGrant` in rhachet sdk. we don't add extra envvar code.

**verdict**: covered (via sdk behavior).

---

## boundary conditions from criteria

| condition | expected | blueprint |
|-----------|----------|-----------|
| keyrack locked | fail-fast with unlock | covered |
| key absent | fail-fast with set | covered |
| key in envvar | keyrack passthrough | covered (sdk) |
| key in vault | return via supplier | covered |
| non-xai brain | skip keyrack | covered |
| xai brain | use keyrack | covered |

---

## error messages from criteria

| scenario | required | blueprint |
|----------|----------|-----------|
| keyrack locked | contains `rhx keyrack unlock --owner ehmpath` | ✓ covered |
| key absent | contains `rhx keyrack set --owner ehmpath --key XAI_API_KEY` | ✓ covered |

---

## gaps found

none. all vision requirements and criteria usecases are covered.

---

## open questions

the blueprint marks reflect.ts as `[?]` open question. this is correct — it was not explicitly requested in the wish.

---

## conclusion

the blueprint covers all requirements from vision and criteria. no gaps found.

