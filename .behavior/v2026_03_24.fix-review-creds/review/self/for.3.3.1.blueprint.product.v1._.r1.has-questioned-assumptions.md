# self-review: has-questioned-assumptions

## stone: 3.3.1.blueprint.product.v1

---

## assumptions questioned

### 1. assumption: `getKeyrackKeyGrant` api exists

**what we assume**: rhachet provides `getKeyrackKeyGrant({ owner, key })` that returns `KeyrackGrantAttempt` with status discriminant.

**evidence**: research in 3.1.1.research.external.product.access shows keyrack sdk patterns. verify exact api name at implementation time.

**verdict**: valid assumption, verify api at implementation time.

---

### 2. assumption: keyrack statuses are exactly 'granted' | 'absent' | 'locked' | 'blocked'

**what we assume**: these four statuses cover all cases.

**what if opposite**: there could be other statuses like 'expired', 'revoked', 'rate-limited'.

**evidence**: research shows these four are the core statuses. the exhaustiveness check in blueprint will catch new statuses at compile time.

**verdict**: valid assumption with safety net (exhaustiveness check).

---

### 3. assumption: brain slug prefix check `startsWith('xai/')` is sufficient

**what we assume**: all xai brains have slugs that start with `xai/`.

**what if opposite**: there could be xai brains with different prefixes, or non-xai brains that happen to start with 'xai/'.

**evidence**: research shows DEFAULT_BRAIN is `xai/grok/code-fast-1`. the slug convention follows `provider/model/variant` pattern.

**verdict**: valid assumption based on observed convention.

---

### 4. assumption: ehmpath owner is correct for this repo

**what we assume**: all ehmpathy repos use `ehmpath` as keyrack owner.

**what if opposite**: different repos could use different owners, or ehmpathy could change the owner name.

**evidence**: the wish explicitly states "ehmpath owner" for this repo. the keyrack.yml can be updated if owner changes.

**verdict**: valid assumption per wish. documented in keyrack.yml for visibility.

---

### 5. assumption: process.exit(2) is appropriate for constraint errors

**what we assume**: exit code 2 signals "user must fix" per exit code semantics.

**evidence**: rule.require.exit-code-semantics.md defines code 2 as constraint (user action required).

**verdict**: valid assumption based on documented convention.

---

### 6. assumption: console.error is sufficient for error output

**what we assume**: write to stderr is appropriate for fail-fast errors.

**what if opposite**: could use structured error output, log framework, or throw exceptions.

**evidence**: extant fail-fast patterns in stepReview use console.error with treestruct format. consistent with rule.forbid.stdout-on-exit-errors.

**verdict**: valid assumption based on extant patterns.

---

### 7. assumption: genContextBrain accepts supplier parameter

**what we assume**: `genContextBrain({ choice, supplier })` accepts optional supplier for credential injection.

**evidence**: research in 3.1.1.research.external.product.access shows `genContextBrainSupplier` pattern. verify exact api at implementation time.

**verdict**: valid assumption, verify api at implementation time.

---

### 8. assumption: keyrack handles envvar passthrough

**what we assume**: when key absent from vault but present as envvar, keyrack returns 'granted' with envvar value.

**what if opposite**: keyrack could return 'absent' and require explicit envvar check.

**evidence**: vision document states "keyrack handles envvar passthrough internally — we only call keyrack". verify behavior in integration test.

**verdict**: assumption per vision, verify in integration test.

---

## summary

| assumption | verdict | action |
|------------|---------|--------|
| getKeyrackKeyGrant api | valid | verify at implementation |
| four grant statuses | valid | exhaustiveness check as safety net |
| xai/ prefix | valid | based on convention |
| ehmpath owner | valid | per wish, documented |
| exit code 2 | valid | per convention |
| console.error | valid | per extant patterns |
| genContextBrain supplier | valid | verify at implementation |
| keyrack envvar passthrough | assumption | verify in test |

no issues found that require blueprint changes. assumptions are either evidenced or will be verified at implementation.

