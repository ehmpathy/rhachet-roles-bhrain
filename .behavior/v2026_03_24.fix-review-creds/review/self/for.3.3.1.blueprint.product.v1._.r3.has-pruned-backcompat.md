# self-review: has-pruned-backcompat (r3)

## stone: 3.3.1.blueprint.product.v1

---

## backwards compatibility review

re-read the blueprint. identified one backwards-compat section.

---

## backwards compat in blueprint

the blueprint has this section:

```
## backwards compatibility

- non-xai brains: unchanged (envvars via `genContextBrain`)
- xai brain with envvar: keyrack handles passthrough internally
- xai brain with keyrack: new behavior (fetches from keyrack)
```

---

## question each concern

### 1. non-xai brains unchanged

**was this requested?**: yes.

**evidence**: wish says "only add this support for XAI_API_KEY for now, specifically when we detect that the brain is from xai"

usecase.4 in criteria says: "non-xai brains work as before" and "envvars are used as usual"

**verdict**: explicitly requested. keep.

---

### 2. xai brain with envvar passthrough

**was this requested?**: implied but not explicit.

**evidence**: wish says keyrack handles envvar passthrough internally. usecase.6 in criteria mentions envvar fallback.

**question**: is envvar fallback required, or can we require keyrack-only?

**analysis**: the wish says "keyrack handles the envvar lookup internally" — this means we call keyrack, and keyrack returns envvar if vault is empty. we don't add extra code for this.

**verdict**: no extra code added. keyrack sdk handles this. no blueprint change needed.

---

### 3. xai brain with keyrack

**was this requested?**: yes.

**evidence**: this is the core of the wish — "pull XAI_API_KEY from rhx keyrack"

**verdict**: explicitly requested. keep.

---

## are there any assumed-compat concerns?

re-read the blueprint for "to be safe" patterns.

### error message format

**question**: did I assume the error format needs to match extant patterns?

**analysis**: not backwards compat — this is convention. no prior keyrack errors to be compatible with.

**verdict**: not a backcompat concern.

### exit code semantics

**question**: did I assume exit codes need to be compatible?

**analysis**: exit code 2 is documented convention for constraint errors. not a backwards compat concern — this follows established patterns.

**verdict**: not a backcompat concern.

---

## open questions

none found. all backwards-compat concerns are explicitly supported by wish or criteria.

---

## conclusion

no backwards-compat concerns need to be flagged. all are explicitly requested.

