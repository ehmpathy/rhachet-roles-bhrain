# self-review r3: has-pruned-backcompat

## what i found

i reviewed the blueprint for backwards compatibility concerns that were not explicitly requested by the wisher.

---

## backwards compatibility analysis

### concern 1: stdin yaml support retained

**blueprint says:** "note: stdin yaml is allowed but not recommended."

**wish says:** wish 7 asks for "best practices and examples" — flags one-by-one is recommended. wish does not say "remove stdin yaml support."

**analysis:** we retain stdin yaml as an alternative input method while we recommend flags. is this backwards compat that wasn't requested?

**verdict:** not a backcompat issue — stdin yaml is valid input mode. the wish asks us to recommend flags, not remove stdin. this is guidance change, not API removal.

---

### concern 2: --scope flag retained for unbound cases

**blueprint says:** `--scope` is "automatic — rarely needed" but still accepted when not bound to route.

**wish says:** "discourage use of --scope repo. scope should be automatic."

**analysis:** we fail-fast if `--scope repo` while bound (per vision). we accept `--scope repo` when unbound because that's the only valid scope in that case. is it backcompat to retain `--scope` for unbound cases?

**verdict:** not backcompat — the flag serves a purpose when unbound. the wish says "automatic" which is achieved via `getDefaultScope()`. the flag is escape hatch for explicit override in valid cases.

---

### concern 3: status enum values

**blueprint says:** valid statuses are `incomplete | blocked | enqueued | inflight | fulfilled`

**wish says:** wish 6 says "forbid unknown args... unknown keys -> failfast"

**analysis:** are these the same status values that existed before? if we add or remove values, that's not backcompat — that's intentional change. let me check the extant GoalStatusChoice type.

**from research:** GoalStatusChoice already has these exact values. no change to the enum. validation just enforces what was already the type.

**verdict:** not backcompat — we enforce extant type at runtime, not maintain old values "to be safe."

---

### concern 4: goal file format unchanged

**blueprint says:** adds `.blockers.latest.json` but doesn't change goal yaml format.

**analysis:** goal yaml structure (slug, why, what, how, status, source) is unchanged. new file is additive.

**verdict:** not backcompat — no format changes, only additions.

---

### concern 5: skill header format

**blueprint says:** rewrite headers with new format and examples.

**analysis:** headers are documentation, not API. changes to headers don't break consumers.

**verdict:** not backcompat — documentation is not contract.

---

## open questions for wisher: none

i found no backwards compatibility concerns that need wisher decision. all changes are either:
- enforce extant types at runtime (not backcompat)
- add new features (not backcompat)
- update documentation (not backcompat)
- follow explicit wish guidance (not backcompat)

---

## summary

| concern | verdict | rationale |
|---------|---------|-----------|
| stdin yaml retained | not backcompat | guidance change, not removal |
| --scope for unbound | not backcompat | serves purpose, wish says "automatic" |
| status values | not backcompat | enforces extant type |
| goal file format | not backcompat | additive only |
| skill headers | not backcompat | docs not contract |

0 backwards compat concerns found that need prune or wisher decision.

the blueprint makes intentional changes (fail-fast on invalid input) rather than maintain old behavior "to be safe."
