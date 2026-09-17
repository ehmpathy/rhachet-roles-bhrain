# domain.term.choice.reason: severity

## .etymology

latin *severitas* — *strictness, gravity* (from *severus*, grave, serious). the english sense names
**the magnitude of a harm** — how grave the matter is, not how soon it wants attention.

⇒ that is exactly the axis the design grades. a concession's severity answers *"how much harm ships
with this?"* — and the whole taxonomy turns on that one axis: a nameable shipped harm is `urgent`; a
maintenance point that ships none is `better`. the word names the axis the harm test measures.

## .why `priority`, `urgency`, and `weight` lost

| candidate | why not |
|---|---|
| `priority` | names **sequence** — which to do first. the budget question is not order; a `better` point is real work the team owes, it is simply not grave enough to earn a round |
| `urgency` | ⛔ the sharpest miss: `urgent` is one of the two VALUES, so `urgency` as the axis name would fold the axis into one of its positions — one word on two concepts (`rule.forbid.domain-term-ambiguity`). severity is the axis; urgent is a point on it |
| `weight` | names **importance / how much it matters**, an un-anchored scalar. severity anchors on a testable fact — the harm that ships — where `weight` invites a felt rank with no test |
| `importance` | same drift as `weight`: a judgment of consequence in general, not the specific, testable magnitude-of-harm the closed set grades |

🟡 **`urgency` is the one worth the row.** the value `urgent` reads so naturally as the axis name
that the overload is easy to reach for — and it would collapse the very distinction the two-position
set exists to hold.

## .the closed set — an invariant, not a scale

severity is not a continuous or open grade. it is **exactly two positions**, and `better` is the
default:

| position | it means | earns more budget? |
|---|---|---|
| **better** | code idealism · maintenance · polish — no nameable shipped harm | 🔴 **never** — it must not weigh the team down |
| **urgent** | a defect that ships REAL harm — security · safety · monetary · reputation · behavioral | ✅ **yes** — the one concession that earns an increased budget |

🔴 **the harm test is the discriminant.** name the harm that ships with it → `urgent`. you cannot
→ `better`, and it evolves. code idealism is never urgent. the bias is strong toward `better`:
`urgent` must clear a nameable shipped harm in the closed set, or it is `better`.

🔴 **`better` NEVER earns budget.** a budget hit with only `better` concessions is good enough — the
maintenance floor is met, the stone proceeds, no human summoned. `better` is real work (it accrues
as tech debt if the budget is not spent), but it is capped by the budget and never justifies more.

## .disputes

_(none open)_

## .evidence

- `S14` — the wisher seed: *"we should split --concede into --concede urgent vs --concede better …
  urgent = security | safety | monetary | reputation | behavioral defects … code idealism is never
  urgent … thats maintenance that buildsup as techdebt … shouldnt weight us down"*
- `philosophy.a-review-budget-balances-perfection-with-pragmatism` — the WHY the severity serves: a
  budget is the floor of maintenance effort; past it, polish is tech debt the team accepts on
  purpose, unless a critical-severity concession defers the good-enough verdict
- `define.invariant.review.peer.budget.urgent-earns-budget` — the invariant this term composes: a
  `better` hit is the maintenance floor met (proceed, no human); an `urgent` hit ships nameable harm
  (warn the human, earn a round)
- `rule.forbid.overzealous-blockers` (reviewer) — the harm test severity borrows: *name the harm
  that ships with it.* the same test that grades a blocker grades a concede's severity
