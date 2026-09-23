# define.invariant.review.peer.budget.urgent-earns-budget

## .what

> **only an urgent concession qualifies for an increased budget.** a `better` concession never does,
> and a budget hit with no urgent concession needs no human at all.

## .kind

**nurture.** the team chose it, to hold review cost against defect risk. a different team could draw
the line elsewhere — the closed urgent set (security · safety · monetary · reputation · behavioral)
is a policy, not a fact of the domain. it stands because it encodes the perfection-vs-pragmatism
trade the fleet pays for (`philosophy.a-review-budget-balances-perfection-with-pragmatism`).

## .invariant

```
concession.severity = urgent  ⟺  concession may earn an increased budget
concession.severity = better  ⟹  concession never earns an increased budget

budget hit ∧ no live urgent concession  ⟹  good enough — proceed, no human
budget hit ∧ ≥1 live urgent concession  ⟹  needs increased budget — the driver tells its human
                                            why THIS STONE bought it
```

🔴 **the second line states an act, and it names its actor on purpose.** it read *"warn the human
this PR"* until 2026-09-21, and both halves of that were wrong in a way that shipped:

- **`warn the human`** named no actor, so it read as a notice some mechanism sends. **none does.**
  every warn surface merely ASKS; the sentence is prose the driver writes. a driver that read the
  passive as already-done wrote naught, and the human met the spend as an unexplained diff
- **`this PR`** named the wrong unit. budget is granted per **stone** (`route.guard.budget --stone`),
  so a pull may hold many stones, or none of the rounds this one bought

## .why

the budget is the maintenance floor, not a cap the driver fights. so a budget hit is the design at
work — perfection has yielded to pragmatism at the line the team drew. the ONE reason to defer that
verdict is a defect that ships real harm:

| the live concessions at the budget hit | the verdict | the human |
|---|---|---|
| all `better`, or none | **good enough** — the stone proceeds | not summoned |
| ≥1 `urgent` | **needs increased budget** — the human grants more | the driver writes them why the stone bought it |

⇒ to let a `better` concession earn budget would weigh the team down with polish that was already
good enough. to summon a human for a no-urgent hit would spend the scarcest resource in the loop on
a verdict the design already rendered.

## .scope

- it governs the **exhaustion** halt — the budget hit — never the ordinary rejection round
- it governs a **concede**, never a dispute (a dispute excludes its concern from the tally; it earns
  no budget by any severity)
- the auto-grant of a round after an urgent concession is a **dream**, not this invariant — this
  invariant warns; it does not itself top up (`.dream/…auto-grant-a-round-after-an-urgent-concession`)

## .the litigation

the line sits at **shipped harm**, and it was drawn there deliberately: only an `urgent` concession
qualifies for *needs increased budget*, and a hit with no urgent concession should not reach a human
at all.

the argument that settled it is the one about code idealism. it is never urgent — it is maintenance,
and maintenance accrues as tech debt if the budget is not spent on it at all. so it earns the floor.
but it must never earn MORE than the floor: a budget that grows for polish is a budget that weighs
the work down, which is the exact outcome a budget exists to prevent.

⇒ the two halves compose into one law. the closed urgent set says **what** earns more; the
good-enough-pass rule says what a hit **without** one costs, which is naught.

## .the counter-argument

*"a driver could grade every concession `urgent` to buy rounds."* stated fairly, and real. two things
bound it: the harm test is a written claim a council reads (`rule.forbid.overzealous-blockers`), and
an `urgent` grade with no nameable harm is the mis-grade that rule forbids. the restraint is social
and countable, never mechanical — the same shape as the dispute's own escape hatch.

## .what would overturn it

- a measured case where a `better` concession genuinely needed more budget to keep the artifact
  shippable — that would show the closed set is too narrow (a nurture reversal)
- a mechanism that grades the harm test automatically — that would move the restraint from social to
  mechanical, and could retire the warn in favor of a gate

## .enforcement

- a `better` concession that earns an increased budget = **blocker**
- a budget hit with no live urgent concession that summons a human = **blocker**
- a budget hit with ≥1 live urgent concession that proceeds with no warn = **blocker**

## .see also

- `philosophy.a-review-budget-balances-perfection-with-pragmatism` — the WHY this grounds
- `define.invariant.review.peer.exhausted` — the exhaustion verdict this refines
- `rule.always.concede-with-a-severity` (driver) — the call-site rule
- `rule.require.grade-a-concession-by-its-harm` (reviewer) — the harm test
