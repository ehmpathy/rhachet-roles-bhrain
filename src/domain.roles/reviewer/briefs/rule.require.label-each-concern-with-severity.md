# rule.require.label-each-concern-with-severity

> **label every concern on TWO axes, in the strict form `[blocker|nitpick][urgent|better]` — two
> adjacent bracketed tokens at the head of the concern. never leave the severity to inference.**

`contract.reviewer-output` already makes you tally by **kind** — `N blockers` / `N nitpicks`. this
rule adds the **harm** axis beside it: each concern carries an explicit `urgent` or `better` label,
so the tallier and the council read the severity you graded rather than guess at it.

## .the strict form

write two adjacent bracketed tokens, kind first, severity second:

```
[blocker][urgent]   [blocker][better]   [nitpick][urgent]   [nitpick][better]
```

no separator, no middle dot — `[blocker][better]`, never `[blocker · better]`.

## .the full matrix — all four pairs are legal

the axes are orthogonal: **kind** grades whether the stone is held, **severity** grades whether
harm ships. they are separate questions, so every combination is real:

| pair | the concern |
|---|---|
| `[blocker][urgent]` | a shipped harm that must not pass |
| `[nitpick][urgent]` | a shipped harm the budget already conceded |
| `[blocker][better]` | 🔴 a rule-forbidden must-fix that ships NO harm — it simply makes the codebase better |
| `[nitpick][better]` | a polish suggestion |

⚠️ **`[blocker][better]` is the pair a first read wants to forbid, and it is valid.** a rule can
forbid a pattern — so the concern is a `blocker` (must-fix, holds the stone) — while the fix ships
no nameable harm. it is a real, common combination; the block comes from the rule, the `better`
from the harm test.

## .the harm test decides `urgent` vs `better`

it is the same test `rule.forbid.overzealous-blockers` gives a blocker — **name the harm that ships
if this is not fixed**:

- **`urgent`** — a defect in the closed set: **security · safety · monetary · reputation ·
  behavioral**, with a harm you can name (who suffers, and how)
- **`better`** — code idealism, maintenance, polish: a tidier shape, a clearer name, an absent guard
  on a case that cannot arise. you cannot name a shipped harm

⇒ this is the mirror of `rule.require.grade-a-concession-by-its-harm`: there you grade a driver's
concession; here you grade your own concern at the moment you raise it, by the identical test.

## ⚠️ .bias to `better` — never infer `urgent`

most concerns keep a codebase workable — a cost the team pays and the user does not. that is
`better`, and it evolves after the budget. **only a nameable shipped harm earns `urgent`.**

- a rule violation is not a harm
- correctness is not a harm
- an unlabeled concern is read as `better` — so a real `urgent` left unlabeled is a mis-grade the
  tallier CANNOT recover

⇒ the tallier reads your explicit label; it never upgrades a `better` to `urgent`. the grade is
yours, and it is load-bearing: a budget hit with a live `urgent` warns the human and earns more
budget, where an all-`better` hit is good enough and needs no human
(`define.invariant.review.peer.budget.urgent-earns-budget`).

## .why it matters

a mis-graded severity is as expensive as a mis-graded kind, in each direction:

| the mis-grade | the cost |
|---|---|
| a `better` concern labeled `urgent` | it earns a round and a human's glance it did not warrant — the budget stops to bound aught |
| an `urgent` concern labeled `better`, or left unlabeled | a shipped harm slips past good-enough and evolves into a defect that reaches a user |

## .enforcement

- a concern reported with no explicit `[urgent|better]` label = **nitpick** (the tallier defaults it
  to `better`, but the grade was yours to make)
- a concern labeled `urgent` with no nameable shipped harm = **blocker** (the mis-grade)
- a concern in the closed harm set with a nameable harm, labeled `better` = **blocker**

## .see also

- `contract.reviewer-output` — the stdout contract this label rides on
- `rule.forbid.overzealous-blockers` — the harm test this reuses
- `rule.require.grade-a-concession-by-its-harm` — the same test, applied to a driver's concession
- `define.invariant.review.peer.budget.urgent-earns-budget` — the law the label feeds
- `philosophy.a-review-budget-balances-perfection-with-pragmatism` — the WHY the severity serves
