# self-review: has-pruned-backcompat (r2)

## stone: 5.1.execution.phase0_to_phaseN.v1

---

## second pass — fresh eyes

cleared my mind. re-read the code from scratch. asked: where might we have added backcompat "to be safe"?

---

## re-examination: is process.env.XAI_API_KEY backcompat?

**first pass said:** it's a workaround, not backcompat.

**second pass asks:** but is the distinction meaningful?

the code:
```typescript
process.env.XAI_API_KEY = apiKey;
```

**what it achieves:**
- makes the key available to `getSdkXaiCreds` via envvar fallback
- this is how the CURRENT rhachet works

**what the wish asked for:**
> pass it in through the upgraded rhachet-brains-xai context

**the tension:**
- we return a supplier (forward compat with "upgraded" rhachet)
- we also set process.env (current rhachet workaround)

**is process.env the backcompat concern?**

no. process.env is not preserving OLD behavior. it's enabling CURRENT behavior.

old behavior: user exports XAI_API_KEY manually
current behavior (with our change): keyrack fetches, sets process.env

the function did not exist before. there is no "old behavior" to preserve.

**verdict confirmed:** workaround, not backcompat.

---

## re-examination: should we ONLY return supplier?

**hypothetical alternative:**
```typescript
// don't set process.env at all
return { supplier: { 'brain.supplier.xai': { creds: ... } } };
```

**would this work today?**

no. `genContextBrain` passes `{}` to brain.ask. supplier would be ignored.

**would removing process.env be "break"?**

for what? there's no extant code that depends on our function. we're writing it for the first time.

**verdict:** there is no backcompat to prune here. the function is new.

---

## re-examination: did we over-handle keyrack statuses?

**r1 said:** 'blocked' handler is needed for type completeness.

**second pass asks:** is 'blocked' even a real status? did we add it "just in case"?

**research check:**
- `KeyrackGrantAttempt` is a discriminated union
- statuses are: 'granted' | 'locked' | 'absent' | 'blocked'
- if we don't handle 'blocked', typescript complains

**is 'blocked' ever returned in practice?**

according to keyrack docs, 'blocked' means permission denied (different from 'locked' which is vault sealed).

**verdict:** 'blocked' is a real status. handling it is type safety, not backcompat.

---

## re-examination: reflect.ts inclusion

**r1 said:** consistency, not yagni.

**second pass asks:** is this backcompat concern?

**what would happen without reflect.ts changes?**
- `rhx reflect --brain xai/...` would not fetch from keyrack
- it would fall back to envvar
- this is the CURRENT behavior, not old behavior

**is preserving "current reflect behavior" backcompat?**

no. reflect never had keyrack support. no prior behavior to break.

**verdict:** reflect.ts is forward compat (new feature for xai brains), not backcompat.

---

## final assessment

searched for backcompat concerns added "to be safe":

| potential concern | is it backcompat? | verdict |
|-------------------|-------------------|---------|
| process.env assignment | no, it's workaround | keep |
| supplier return | no, it's forward compat | keep |
| 'blocked' handler | no, it's type safety | keep |
| reflect.ts changes | no, it's new feature | keep |

**backcompat we added without explicit request:** none found.

the entire implementation is NEW code. there is no prior behavior to be backwards compatible with.

this feature introduces keyrack support where none existed before.
