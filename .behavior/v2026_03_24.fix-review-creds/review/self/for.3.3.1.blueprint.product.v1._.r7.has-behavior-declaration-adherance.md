# self-review: has-behavior-declaration-adherance (r7)

## stone: 3.3.1.blueprint.product.v1

---

## r7: blueprint-to-spec adherence check

took a breath. re-read the blueprint line by line. verified each part matches vision and criteria.

---

## blueprint section: summary

**blueprint says**:
> "integrate keyrack credential retrieval into the review skill for xai brains. when brain slug starts with `xai/`, fetch `XAI_API_KEY` from keyrack via supplier pattern. fail-fast with actionable instructions if keyrack is locked or key is absent."

**vision says**:
> "reviewer role declares its credential requirements in a keyrack manifest, and the review cli fetches xai credentials from keyrack automatically, with fail-fast and actionable instructions if unavailable."

**adherence check**:
- keyrack integration: matches
- xai brain detection: matches
- supplier pattern: matches
- fail-fast with instructions: matches

**verdict**: adheres.

---

## blueprint section: filediff tree

**blueprint proposes**:
```
src/
├─ domain.roles/reviewer/keyrack.yml
├─ domain.operations/credentials/getXaiCredsFromKeyrack.ts
└─ contract/cli/review.ts (modified)
```

**vision expects**:
- role manifest: yes (keyrack.yml)
- credential fetch: yes (getXaiCredsFromKeyrack)
- cli integration: yes (review.ts)

**adherence check**: all expected files are present.

**verdict**: adheres.

---

## blueprint section: codepath tree

**blueprint describes**:
```
review.ts
├─ detect brain choice
│  └─ if brain.startsWith('xai/')
│     └─ getXaiCredsFromKeyrack()
│        ├─ status: 'granted' → return creds
│        ├─ status: 'locked' → fail-fast
│        ├─ status: 'absent' → fail-fast
│        └─ status: 'blocked' → fail-fast
```

**criteria expects**:
- usecase.1: granted → review completes
- usecase.2: locked → fail-fast
- usecase.3: absent → fail-fast
- usecase.4: non-xai → skip keyrack

**adherence check**: codepath handles all status cases per criteria.

**verdict**: adheres.

---

## blueprint section: getXaiCredsFromKeyrack contract

**blueprint code**:
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

**vision says**:
> "credentials flow via `context['brain.supplier.xai']`"

**adherence check**: supplier key is `'brain.supplier.xai'`. matches vision.

**rhachet-brains-xai expects**:
```typescript
type BrainSuppliesXai = {
  creds: () => Promise<{ XAI_API_KEY: string }>;
};
```

**adherence check**: `creds: async () => ({ XAI_API_KEY: grant.value })` matches the interface.

**verdict**: adheres.

---

## blueprint section: error messages

### locked keyrack

**blueprint shows**:
```
🦉 patience, friend

✋ keyrack is locked
   ├─ owner: ehmpath
   └─ run: rhx keyrack unlock --owner ehmpath --prikey ~/.ssh/ehmpath --env all
```

**criteria says** (usecase.2):
> "error includes `rhx keyrack unlock --owner ehmpath`"

**adherence check**: message includes the exact command format.

**verdict**: adheres.

### absent key

**blueprint shows**:
```
🦉 patience, friend

✋ XAI_API_KEY not found in keyrack
   ├─ owner: ehmpath
   └─ run: rhx keyrack set --owner ehmpath --key XAI_API_KEY
```

**criteria says** (usecase.3):
> "error includes `rhx keyrack set --owner ehmpath --key XAI_API_KEY`"

**adherence check**: message includes the exact command format.

**verdict**: adheres.

---

## blueprint section: keyrack.yml

**blueprint shows**:
```yaml
org: ehmpath

env.all:
  - XAI_API_KEY
```

**vision says**:
> "role manifest declares org: ehmpath"
> "env.all: - XAI_API_KEY"

**adherence check**: yaml matches vision exactly.

**verdict**: adheres.

---

## blueprint section: exit codes

**blueprint defines**:
| code | semantic |
|------|----------|
| 0 | success |
| 2 | constraint |
| 1 | malfunction |

**rule.require.exit-code-semantics says**:
| code | semantic |
|------|----------|
| 0 | success |
| 2 | constraint |
| 1 | malfunction |

**adherence check**: exit codes match established semantics.

**verdict**: adheres.

---

## blueprint section: backwards compatibility

**blueprint states**:
- non-xai brains: unchanged
- xai brain with envvar: keyrack passthrough
- xai brain with keyrack: new behavior

**criteria usecase.4 says**:
> "non-xai brains work as before"

**criteria usecase.6 says**:
> "envvar fallback works via keyrack"

**adherence check**: blueprint states match criteria expectations.

**verdict**: adheres.

---

## potential deviations found

### deviation 1: reflect.ts

**blueprint marks as open question**:
```
└─ [?] reflect.ts                     # OPEN QUESTION: include for consistency?
```

**wish says**: only mentions review skill.

**analysis**: this is correctly flagged as an open question, not implemented by default. this adheres to YAGNI — do not add unrequested features.

**verdict**: correct behavior (flagged, not implemented).

---

## summary table

| blueprint section | spec source | adheres? |
|-------------------|-------------|----------|
| summary | vision | yes |
| filediff tree | vision | yes |
| codepath tree | criteria | yes |
| getXaiCredsFromKeyrack | rhachet-brains-xai | yes |
| error messages | criteria | yes |
| keyrack.yml | vision | yes |
| exit codes | rule | yes |
| backwards compat | criteria | yes |
| reflect.ts | wish (absent) | yes (flagged) |

---

## gaps found

none. the blueprint adheres to the behavior declaration throughout.

---

## conclusion

every section of the blueprint correctly implements the vision and criteria. no deviations or misinterpretations found.

