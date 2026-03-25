# self-review: has-pruned-backcompat (r1)

## stone: 5.1.execution.phase0_to_phaseN.v1

---

## backwards compatibility review

took a breath. re-read the code. asked: what backwards compat did we add, and was it requested?

---

## backwards compat concern 1: process.env.XAI_API_KEY

**what it is:**
```typescript
// set in process.env for current rhachet compatibility
process.env.XAI_API_KEY = apiKey;
```

**was it explicitly requested?**

the wish says:
> pass it in through the upgraded rhachet-brains-xai context

it does NOT say "also set process.env".

**why did we add it?**

research revealed:
- rhachet's `genContextBrain` passes `{}` as context to brain operations
- `getSdkXaiCreds` falls back to `process.env.XAI_API_KEY` when context lacks supplier

without this, the key would be fetched but never used.

**evidence it's needed:**

1. the research artifact documents this limitation
2. the .note in the jsdoc explains why
3. the supplier return is for "future compatibility when rhachet supports it"

**verdict:** this is not "backwards compat to be safe". this is a workaround for a current limitation. it's documented. it's necessary.

**open question for wisher?** no — this is implementation detail, not a design decision.

---

## backwards compat concern 2: envvar passthrough

**what it is:**

the vision says:
> keyrack handles envvar passthrough internally — we only call keyrack

**was it explicitly requested?**

the wish says:
> pull XAI_API_KEY from `rhx keyrack` rather than depend on envvars

this could be interpreted as:
- (a) use keyrack instead of envvars (no envvar support)
- (b) use keyrack as primary, envvar as fallback

**what we implemented:**

we call `keyrack.get()` — keyrack itself handles envvar passthrough internally.

we do NOT add explicit envvar fallback code like:
```typescript
// we did NOT write this
const apiKey = keyrackResult ?? process.env.XAI_API_KEY;
```

**verdict:** we rely on keyrack's built-in behavior, not our own fallback code. this is not backcompat we added — it's keyrack's behavior.

**open question for wisher?** no — keyrack's passthrough is its feature, not our decision.

---

## backwards compat concern 3: non-xai brains unchanged

**what it is:**

non-xai brains continue to use envvars as before. no keyrack call.

**was it explicitly requested?**

the wish says:
> only add this support for XAI_API_KEY for now, specifically when we detect that the brain is from xai

this explicitly scopes to xai brains. non-xai unchanged is implicit.

**is this backcompat we added "to be safe"?**

no — this is the scope boundary. we did not write extra code to preserve non-xai behavior. we simply didn't touch it.

**verdict:** not backcompat, just scope limit.

---

## backwards compat concern 4: supplier return type

**what it is:**

the function returns a supplier object even though it's not currently used:
```typescript
return {
  supplier: {
    'brain.supplier.xai': {
      creds: async () => ({ XAI_API_KEY: apiKey }),
    },
  },
};
```

**was it explicitly requested?**

the wish says:
> pass it in through the upgraded rhachet-brains-xai context

the vision mentions supplier pattern for "future compatibility".

**is this backcompat or forward compat?**

this is forward compat — it prepares for when rhachet supports supplier context.

**verdict:** forward compat, not backcompat. documented in jsdoc.

**open question for wisher?** no — the wish explicitly mentions "upgraded... context", this prepares for it.

---

## summary

| concern | type | requested | verdict |
|---------|------|-----------|---------|
| process.env assignment | workaround | implicit (required for function) | keep |
| envvar passthrough | keyrack behavior | n/a (not our code) | n/a |
| non-xai unchanged | scope limit | explicit ("only... xai") | keep |
| supplier return | forward compat | explicit ("upgraded context") | keep |

**backcompat we added without request:** none.

all compatibility-related code is either:
1. necessary workaround (documented)
2. keyrack's behavior (not our code)
3. scope boundary (not extra code)
4. forward compat (explicitly requested)

no changes needed. all backcompat is justified.
