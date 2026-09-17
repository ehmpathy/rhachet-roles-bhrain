# seed S6 — option B is the declaration shape

**said** — 2026-09-08, by the wisher · **kind** — **a verdict on a fork**

## .said — verbatim, untouched

> *"sounds like we have our a*
> *#: B ✅*
> *shape: group: anthropic + groups: {anthropic: {concurrency: 10}}*
> *knowledge where held: ✅*
> *5-of-8 split: ✅*
> *F3-compatible: ✅*
> *names WHY: ✅"*

⚠️ the truncated *"our a"* and the quoted comparison row are the wisher's, kept verbatim.

## .settled

🔴 **fulcrum F1 takes option B.** the declaration shape is:

```yaml
reviews:
  peer:
    - slug: alpha-checker
      level: 1
      group: anthropic        # ← MEMBERSHIP, on the reviewer
  groups:
    anthropic:
      concurrency: 10         # ← THE BOUND, on the group
```

⇒ **two facts, two homes**, per S4's structural argument: membership is decided reviewer-by-reviewer
by the author who knows which provider it calls; the bound is a cardinality, which describes the set.

⚠️ **the wisher confirmed by the comparison's own criteria** — all four columns checked, rather than
by preference. that is the strongest form a fork verdict takes: the option set was made explicit,
and the pick is checkable against it.

## 🔴 .what it settles, and what it does NOT

| question | state |
|---|---|
| where **membership** is declared | ✅ **settled** — `group:` on the reviewer |
| where **the bound** is declared | ✅ **settled** — `groups: { <name>: { concurrency: N } }` |
| 🔴 one group per reviewer, or several? | ⏸️ **still open** — `group: anthropic` vs `group: [anthropic, hostmem]` |
| 🔴 is `10` the DEFAULT, or only what you would declare? | ⏸️ **still open** — fulcrum F2 |

⇒ the quoted shape uses a **scalar** `group:` and the number **10**, so it is consistent with a
single-group sense and with `10` as a declared value. **neither is thereby settled** — the shape was
quoted from the comparison table, where both were illustrative.

⚠️ **both remain clean**: a scalar widens to a list without a teardown, and a default is one value in
the parser.

## .landed

- `.fulcrums/inventory.of=fulcrums.case=F1-where-concurrency-is-declared.md` — verdict recorded
- `1.vision.yield.md` — Q1
- `1.vision.experience.case=3.author-declares-the-bound.md` — the demo owes the new shape
- `1.vision.experience.case=7.conflicted-bounds-are-refused-at-parse.md` — the parse refusals owe
  the reference-integrity check
