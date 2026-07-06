# contract.reviewer-output

## .what

the exact stdout contract every reviewer MUST satisfy so the route guard can read its verdict.

when a reviewer runs under a route guard (peer review), the guard parses the reviewer's
**stdout** to learn how many blockers and nitpicks it found. this brief states precisely what
that stdout must contain.

## .why

the guard cannot pass a stone on a review it cannot read. if the guard finds no numeric count,
it can NOT assume zero — a silent "0 blockers, 0 nitpicks" would look like a clean approval when
in truth no verdict was seen. so an unreadable review is treated as a **`💥 malfunction`** for
that reviewer, and the stone blocks. see `rule.forbid.failhide`.

## .the contract

your stdout MUST contain a **numeric** count for **both** dimensions:

- blockers: `N blockers` — or `blockers: N` — where `N` is an integer `>= 0`
- nitpicks: `N nitpicks` — or `nitpicks: N` — where `N` is an integer `>= 0`

to declare a clean review, state the zeros explicitly:

```
0 blockers
0 nitpicks
```

## .numbers only

only a **number** counts. these do NOT satisfy the contract and cause a `💥 malfunction`:

| stdout | why it fails |
|--------|--------------|
| `blockers = none` | word-form, not a number |
| `no blockers found` | prose, not a numeric count |
| `blockers: n/a` | not a number |
| (blockers omitted entirely) | absent — the guard cannot infer zero |
| `looks solid, ship it` | no counts at all |

one form to emit, one form to parse. numbers are unambiguous; words invite drift and
incidental-match traps (e.g. "no major blockers here" must never read as a count).

## .the canonical form

the built-in `rhx review` skill already conforms — it emits a summary tree via
`genReviewOutputStdout`:

```
   └─ summary
      ├─ 0 blockers ✓
      ├─ 2 nitpicks 🟠
      └─ ...
```

if you author your own reviewer, the **minimal** valid stdout is just the two numeric lines:

```
3 blockers
1 nitpick
```

## .what the guard does with it

| your stdout | guard reads | outcome |
|-------------|-------------|---------|
| `0 blockers` + `0 nitpicks` | detected, clean | approved |
| `3 blockers` + `1 nitpick` | detected, issues | rejected (blocks per thresholds) |
| only one dimension, or none | undetected | `💥 malfunction` (blocks) |

## .enforcement

reviewer stdout without a numeric count for both dimensions = `💥 malfunction` = **blocker**.
