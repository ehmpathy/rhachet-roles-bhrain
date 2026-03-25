# self-review: has-pruned-backcompat (r4)

## stone: 3.3.1.blueprint.product.v1

---

## r4: deeper backwards compatibility pass

took a breath. re-read the wish, criteria, and blueprint with fresh eyes.

---

## the backcompat section in blueprint

```
## backwards compatibility

- non-xai brains: unchanged (envvars via `genContextBrain`)
- xai brain with envvar: keyrack handles passthrough internally
- xai brain with keyrack: new behavior (fetches from keyrack)
```

---

## re-evaluate each concern with evidence

### concern 1: non-xai brains unchanged

**what does the blueprint promise?**: non-xai brains continue to work via envvars.

**did wisher request this?**: yes.

**evidence from wish**:
> "only add this support for XAI_API_KEY for now, specifically when we detect that the brain is from xai"

the phrase "only... when we detect that the brain is from xai" implies: when brain is NOT xai, do NOT change behavior.

**evidence from criteria**:

usecase.4 says:
```
given(user specifies `--brain anthropic/claude-3`)
  when(user runs `rhx review --brain anthropic/claude-3 ...`)
    then(keyrack is NOT consulted for credentials)
      sothat(non-xai brains work as before)
    then(envvars are used as usual)
      sothat(backwards compatibility is preserved)
```

this explicitly states "backwards compatibility is preserved" for non-xai brains.

**verdict**: explicitly requested. keep.

---

### concern 2: xai brain with envvar passthrough

**what does the blueprint promise?**: if xai brain but key is in envvar (not keyrack vault), it still works.

**did wisher request this?**: implied.

**evidence from wish**:
> "envvars will still work for any other creds required as usual, e.g., if they want to use a different brain"

this talks about "other creds" for "different brain", not XAI_API_KEY specifically.

**evidence from criteria**:

usecase.6 says:
```
given(keyrack is unlocked)
given(XAI_API_KEY is NOT in keyrack vault)
given(XAI_API_KEY IS set as envvar)
  when(user runs `rhx review ...`)
    then(review completes)
      sothat(envvar fallback works via keyrack)
    then(keyrack handles the envvar lookup internally)
      sothat(review code only calls keyrack, not envvar directly)
```

this explicitly requests envvar fallback for XAI_API_KEY.

**verdict**: explicitly requested via usecase.6. keep.

---

### concern 3: xai brain with keyrack

**what does the blueprint promise?**: new behavior — fetch from keyrack.

**did wisher request this?**: yes. this is the core ask.

**evidence from wish**:
> "upgrade the review skill to pull XAI_API_KEY from rhx keyrack"

**verdict**: core request. keep.

---

## hidden backcompat concerns?

re-read the blueprint for implicit assumptions about backwards compat.

### error message format

**question**: did I assume error format must be compatible with extant errors?

**analysis**: there are no extant keyrack-related errors. this is new error output, not backwards compat.

**verdict**: not a backcompat concern.

---

### exit code 2 for constraint

**question**: did I assume exit code semantics must be preserved?

**analysis**: this is forward design based on rule.require.exit-code-semantics, not backwards compat with prior behavior.

**verdict**: not a backcompat concern.

---

### cli interface unchanged

**question**: did I assume the cli flags must stay the same?

**analysis**: no new flags are added. the change is internal (keyrack fetch before brain creation). the external contract (cli flags, output format) is unchanged.

**what if we added a flag like `--keyrack-owner`?**

this would be a new feature, not backcompat. but the blueprint does not add any new flags — it hardcodes `ehmpath` per the wish.

**verdict**: no backcompat concern. cli interface unchanged.

---

## open questions

none found. all backwards-compat concerns trace to explicit wish or criteria.

---

## summary

| backcompat concern | requested by | evidence |
|-------------------|--------------|----------|
| non-xai unchanged | wish + usecase.4 | "only... when xai" |
| envvar fallback | usecase.6 | "envvar fallback works via keyrack" |
| new keyrack behavior | wish | "pull XAI_API_KEY from rhx keyrack" |

---

## why they hold

all three backcompat promises are explicitly requested:

1. non-xai unchanged — the wish scopes the change to xai only
2. envvar fallback — usecase.6 explicitly tests this scenario
3. new keyrack — this is the core wish

no "to be safe" assumptions. all evidence-based.

---

## conclusion

no backcompat concerns need to be flagged or eliminated. all are explicitly requested.

