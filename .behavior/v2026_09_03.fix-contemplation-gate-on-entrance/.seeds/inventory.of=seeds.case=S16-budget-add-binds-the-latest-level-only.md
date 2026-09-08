# seed S16 — a budget top-up binds the latest level only

## .said — verbatim, 2026-09-07

> also, by default, add budget should ONLY impact the LATEST level. not all elvels

> if someone wants earlier levels, they can prescribe those

## .settled

**`route.guard.budget --for review --add N` defaults to the LATEST level. earlier levels are opt-in,
by explicit prescription.**

| the caller wants | the caller writes |
|---|---|
| more rounds for the level now under review | `--add N` |
| more rounds for an earlier level | `--add N` **plus an explicit level**, prescribed |

## 🔴 .why — the blanket add is an unasked-for refund to lanes that already spoke

today the add extends **every** reviewer on the stone at once. so a top-up meant to let l3 confirm a
fix also hands fresh rounds to five l1 lanes that already reached a verdict.

| the harm | how it lands |
|---|---|
| **cost** — every re-armed lane may re-run, and a re-run is a brain call | the add's price is `N × lanes`, never `N` |
| 🔴 **it re-opens a settled level** | the direct contradiction of S15, and the two were said in the same breath for that reason |
| **the meter no longer means what it says** | a level's residual rounds stop to track that level's own convergence |

⇒ **a budget is per-lane by construction; the add was the one operation that ignored that.**

## ⚠️ .the ergonomic argument for the default

`rule.prefer.defaults-match-common-case` decides which side gets the bare invocation. the common case
is unambiguous: **a driver tops up because the level under review needs another round.** a top-up
aimed at an earlier level is the rare, deliberate act — so it is the one that earns a flag.

⚠️ **and the safe path becomes the easy path.** the blanket form spends more and re-opens settled work
by default; the scoped form does neither. that is `rule.require.safe-by-default` exactly — the bare
call should not be the expensive, wide one.

## 🔴 .a booted brief states the old behavior and must move with the code

`rule.always.spend-own-levers-before-escalation` says, in the driver's `say` tier:

> *"budget is not scarce, and to treat it as scarce is the error. `--add N` extends every reviewer on
> the stone at once."*

⇒ **that sentence becomes false the moment this ships.** a brief that describes a lever's blast radius
carries real weight for how a driver reasons about cost, so the code change and the brief edit are one
change, not two.

## .landed

- ⏳ the default narrowed to the latest level — owed
- ⏳ an explicit level prescription on the CLI — owed
- ⏳ `rule.always.spend-own-levers-before-escalation` amended (+ `.md.min`) — owed
