# define.invariant.review.peer.judge.urgent-guides-the-budget-grant

## .what

> **the `reviewed?` judge, when it holds the stone on a live urgent concession, must GUIDE the
> driver to its own budget top-up, and ask it to write its human why the stone bought budget.**

a judge that holds a stone names the remedy and its owner. `approved?` holds on absent approval,
whose remedy only a human may run, so it prints *"please ask your human to … --as approved"*.
`reviewed?` holds on a live urgent concession, whose remedy is a top-up the **driver** may run, so
it prints *"increase budget — yours to spend"*, the command, and the note ask. never a bare
`passed: false`.

## .kind

**nurture.** no rule in the domain forces a judge to explain its own remedy — it could exit `2` with
a terse reason and leave the driver to derive the fix. the team chose a halt that guides, because
the scarcest resource in the loop is the human's attention, and a judge that names the exact command
and its true owner spends that attention only where a human is needed
(`rule.require.errors-name-the-fix`).

## .invariant

```
approved?  holds ∧ remedy = human approval    ⟹  judge names a human, and the approval command
reviewed?  holds ∧ live urgent concession      ⟹  judge names the driver, the top-up, and the note ask

reviewed?  holds ∧ no live urgent concession   ⟹  no budget remedy — no round was earned
```

⇒ the owner a judge names is the owner the **mechanism** enforces. `setStoneAsApproved` refuses a
caller with no TTY, so approval is a human's. `route.guard.budget` checks no actor — a human who
runs it meets the same three-conjunct gate (`computeBudgetGrantRefusal`) the driver does — so the
top-up is the driver's (`term=route.guard.budget._.choice._.md`).

## .why

the `reviewed?` judge tallies concerns across lanes against the allowances and holds when the sum
exceeds them. a **conceded** concern is kept in that sum (a concede keeps the hold), so an urgent
concession that ran the ladder to exhaustion leaves the stone held — and its remedy is *more
budget*, which the urgent grade already earned.

| the judge | what holds it | who lifts it | what it must print |
|---|---|---|---|
| `approved?` | absent human approval | a human | *"please ask your human to … --as approved"* |
| `reviewed?`, urgent concession | a live urgent concession over the allowance | the **driver**, via its warranted top-up | *"increase budget — yours to spend"*, the top-up, *"tell your human why this stone bought budget"* |
| `reviewed?`, better/none | the sum over the allowance | the **driver**, via convergence | no budget remedy |

⇒ a judge that named a human for the urgent top-up would buy a round trip and no power: the human's
paste meets the same gate. the note keeps the human informed with no wait on it
(`define.invariant.review.peer.budget.urgent-earns-budget`).

## .scope

- it governs the **judge** surface (`rhx route.stone.judge --mechanism reviewed?`). the exhaustion
  halt in `setStoneAsPassed` is its peer, and both read one label (`REMEDY_LABEL_BUDGET_GRANT`)
  and one round count (`ROUNDS_OFFERED_ON_GRANT`), so both print one command
- it fires only on a **live urgent** concession against the current generation — a lapsed or
  disputed absorption earns no top-up
- it does not itself grant budget; it **guides** the driver to the top-up

## .the litigation

it first settled as a mirror: the `approved?` judge says only a human may approve, so the
`reviewed?` judge said only a human may grant budget. the mirror of SHAPE holds — one halt names one
remedy and one owner, so a driver reads one halt vocabulary. the mirror of OWNER did not: the grant
gate checks a warrant, never an actor, so the urgent remedy was the driver's all along. the drive
halt already said *"yours to spend"*, and the two surfaces named two owners for one command.

## .the counter-argument

*"a human in the loop at the moment of spend is a safeguard."* stated fairly. but the human added no
check: it pasted a command the gate judged exactly as it would the driver's. the real safeguards are
the gate (a live urgent concession, a dry reviewer, one stone) and the written harm claim a council
reads. the note puts that claim in front of the human, which a paste never did.

## .what would overturn it

- a budget gate that checks the actor — then the urgent top-up is a human's, and the judge names one
- a mechanism that grants the urgent round automatically (the deferred auto-grant dream) — then the
  judge would print *"a round was granted, re-arrive"*, plus the note ask

## .enforcement

- a `reviewed?` judge that holds on a live urgent concession and prints no top-up guidance = **blocker**
- a `reviewed?` judge that names a human as the owner of the top-up = **blocker**
- a top-up label or command that differs from the exhaustion halt's = **blocker** (one lever, one owner, one command)

## .see also

- `define.invariant.review.peer.budget.urgent-earns-budget` — the POLICY this judge surfaces
- `define.invariant.review.peer.passage` — pass ⟺ every peer guard terminal
- `rule.require.errors-name-the-fix` (ergonomist) — why a halt names its remedy
- `rule.always.spend-own-levers-before-escalation` (driver) — the top-up in the driver's column
