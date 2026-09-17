# define.invariant.review.peer.judge.urgent-guides-the-budget-ask

## .what

> **the `reviewed?` judge, when it holds the stone and an urgent concession stood in the last round,
> must GUIDE the driver to ask the human for budget — the same way the `approved?` judge guides the
> driver to ask the human to approve.**

a judge that holds a stone on a **human-only** remedy names that remedy to the human. `approved?`
holds on absent approval and prints *"please ask your human to … --as approved"*. `reviewed?` holds
on a live urgent concession, and its remedy is a **human budget grant** — so it must print that,
never a bare `passed: false`.

## .kind

**nurture.** no rule in the domain forces a judge to explain its own remedy — it could exit `2` with
a terse reason and leave the driver to derive the fix. the team chose the guiding form because the
scarcest resource in the loop is the human's attention, and a judge that names the exact command
spends it once instead of sending the driver to hunt (`rule.require.errors-name-the-fix`). the two
judges are held to the **same** shape on purpose: a driver reads one halt vocabulary, never two.

## .invariant

```
approved?  holds ∧ remedy = human approval    ⟹  judge prints the approval-ask guidance
reviewed?  holds ∧ live urgent concession      ⟹  judge prints the budget-ask guidance

reviewed?  holds ∧ no live urgent concession   ⟹  no human named — the driver's own lever
```

⇒ the third line is the bound that keeps the second honest: a hold with only `better` concessions
(or none) is the driver's own budget lever, so the judge must **not** summon a human there
(`define.invariant.review.peer.budget.urgent-earns-budget`).

## .why

the `reviewed?` judge tallies concerns across lanes against the allowances and holds when the sum
exceeds them. a **conceded** concern is kept in that sum (a concede keeps the hold), so an urgent
concession that ran the ladder to exhaustion leaves the judge holding — and its one honest remedy is
*more budget, from a human*.

| the judge | what holds it | who lifts it | what it must print |
|---|---|---|---|
| `approved?` | absent human approval | a human | *"please ask your human to … --as approved"* |
| `reviewed?`, urgent concession | a live urgent concession over the allowance | a human budget grant | *"please ask your human to … route.guard.budget --add N"* |
| `reviewed?`, better/none | the sum over the allowance | the **driver** | the driver's own top-up — no human named |

⇒ a `reviewed?` judge that holds on an urgent concession and prints only `passed: false` **strands**
the driver: the remedy is a human's, and the judge stayed silent on it. that is the exact gap the
`approved?` judge closes for its own case, one tier down.

## .scope

- it governs the **judge** surface (`rhx route.stone.judge --mechanism reviewed?`) — the guidance the
  judge renders. the exhaustion-gate halt in `setStoneAsPassed` is its sibling, governed by
  `define.invariant.review.peer.budget.urgent-earns-budget`; both must name the same remedy
- it fires only on a **live urgent** concession against the current generation — a lapsed or
  disputed absorption does not summon a human
- it does not itself grant budget (that auto-grant is a dream); it **guides** the ask

## .the litigation

it settled fast, because the model was supplied with the question: the `approved?` judge already
explains that only a human may approve, so the `reviewed?` judge must explain that only a human may
grant budget.

⇒ **the mirror IS the argument.** a driver reads one halt vocabulary, never two — so a human-only
remedy is named by whichever judge holds on it, and no rival shape was left to weigh.

## .the counter-argument

*"the exhaustion gate in `setStoneAsPassed` already warns for urgent — the judge is redundant."*
stated fairly. but the judge runs on its own path (`route.stone.judge`, and `runStoneGuardJudges`
shells out to it), so a driver that reaches the judge past the gate — a judges-only invocation, a
re-run — would get a bare `passed: false`. the two surfaces are defense-in-depth, exactly as the
`approved?` judge duplicates the approval guidance the drive halts also carry.

## .what would overturn it

- a collapse of the two judge surfaces into one, so a single halt formatter renders every human-only
  remedy — then the invariant moves to that formatter rather than each judge
- a mechanism that grants the urgent round automatically (the deferred auto-grant dream) — then the
  judge would print *"a round was granted, re-arrive"* rather than *"ask your human"*

## .enforcement

- a `reviewed?` judge that holds on a live urgent concession and prints no budget-ask guidance = **blocker**
- a `reviewed?` judge that names a human for a `better`/none hit (the driver's own lever) = **blocker**
- budget-ask guidance whose command differs from the exhaustion gate's = **blocker** (one remedy, one command)

## .see also

- `define.invariant.review.peer.budget.urgent-earns-budget` — the POLICY this judge surfaces
- `define.invariant.review.peer.passage` — pass ⟺ every peer guard terminal
- `rule.require.errors-name-the-fix` (ergonomist) — why a halt names its remedy
- `rule.always.spend-own-levers-before-escalation` (driver) — the better/none case: the driver's own top-up
