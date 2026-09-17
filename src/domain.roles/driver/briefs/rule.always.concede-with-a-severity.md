# rule: concede with a severity — ALWAYS required; `urgent` only for shipped harm

## .what

when you hold the driver role and you concede a peer concern, you grade it with a **severity** —
`--severity` is REQUIRED on every concession. there is no ungraded concede (a mandatory invariant):

```sh
rhx route.stone.set --stone <stone> --as conceded --with <reviewer> --about <concern> --severity better
rhx route.stone.set --stone <stone> --as conceded --with <reviewer> --about <concern> --severity urgent
```

- **`better`** is the common grade — code idealism, maintenance, polish. it never earns more budget.
- **`urgent`** is the escalation — a defect that ships REAL harm. it is the ONE concession that
  earns an increased budget, and the only one that warrants a human at a budget hit.

⇒ `better` is the grade you reach for most, but you reach for it EXPLICITLY — a concede with no
`--severity` is refused, so the harm test below is made on every concession rather than skipped.

this is the call-site half of `philosophy.a-review-budget-balances-perfection-with-pragmatism` and
`define.invariant.review.peer.budget.urgent-earns-budget`. the philosophy states the why; the
invariant states the law; this rule states which word to reach for, mid-drive.

## .why

the budget is the maintenance floor — spend at least it, and the artifact is good enough. a severity
is how the fleet tells the two kinds of residual defect apart:

- a `better` concession is real work the team owes; it accrues as tech debt if the budget is not
  spent, and it evolves into a later round. it must **never** weigh the team down with more budget.
- an `urgent` concession ships harm now, so it defers the good-enough verdict — the one case that
  earns more rounds and a human's glance.

⇒ if a driver graded everything `urgent`, the budget would stop to bound anything. if a driver
graded everything `better`, a real shipped defect would slip past good-enough. the severity is the
signal that keeps the budget honest.

## .the closed urgent set

> **urgent = security · safety · monetary · reputation · behavioral defects.**
> **code idealism is never urgent.**

| axis | reach for `urgent` when… | it is `better` when… |
|---|---|---|
| **security** | a leak, an injection, an authz hole | a name could read clearer |
| **safety** | a data-loss path, a destructive default | a guard is absent on a case that cannot arise |
| **monetary** | a double-charge, a wrong price | a redundant compute costs a few ms |
| **reputation** | a user-visible wrong answer, a broken promise | a log line reads oddly |
| **behavioral** | the feature does the wrong thing | a refactor would tidy the right thing |

## .the test — name the harm

> **name the harm that ships if this concern is not fixed now.**

- you can name it — a user or an on-call engineer suffers X → **`urgent`**
- you cannot → **`better`**, and it evolves

this is the reviewer's own harm test (`rule.forbid.overzealous-blockers`), read from the driver's
seat. a concern is not `urgent` because it is correct, or because a rule names it — it is `urgent`
only when a shipped harm has a name.

## .the rule

| the concession is… | the severity | what it earns |
|---|---|---|
| code idealism, polish, a tidier shape | **`better`** | no budget — it evolves after the budget |
| a defect in the closed harm set, with a nameable harm | **`urgent`** | more budget, and a human's warn at a budget hit |
| you cannot name a harm | **`better`** | the harm test failed; it is not urgent |

## .the anti-pattern

- **the urgent-for-budget grab** — a concern graded `urgent` to buy a round, with no nameable harm.
  it is the mis-grade `rule.forbid.overzealous-blockers` forbids, from the other seat.
- **the better-that-demands-budget** — a `better` concession offered as a reason to top up. `better`
  never earns budget; spend at least the floor and evolve it.
- **the ungraded concede** — a concede with no `--severity`. it is REFUSED: severity is a mandatory
  invariant, so there is no default to reach for. grade every concession by its harm — `better` for
  maintenance, `urgent` only for a nameable shipped harm — never dodge the test by omission.

## .the owl's wisdom 🦉

> perfection has no end; the budget is where the road says enough.
> a `better` note waits by the path, to be tended when the season comes.
> only a real harm — one you can name — earns the caravan another day. 🍵
