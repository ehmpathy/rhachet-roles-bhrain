# F34 — a poke row's nullability is a property of its ACT, and the type says otherwise

- rework: 🔴 **dirty** — five readers of one type across the warmer subsystem
- status: 🟡 **BEST-GUESSED 2026-09-25 — option A: guard at runtime, defer the union**
- confidence: 🟡 **84%**

## .the fork, stated fairly

a peer round raised an unaccounted-spend blocker: `getOneWarmerCost` folded a **torn
poke** — `act: 'poke'` with `measured: null` — in as free spend, so a warmer's bill
read lower than it was. the repair is not in dispute. what is a fork is **where the
guarantee lives**.

| | option A — a runtime guard | option B — a discriminated union |
|---|---|---|
| where the claim lives | `asPokeMeasurement`, a private throw in one reader | `WarmerPokeRow`, on the type itself |
| rung of `prefer.prevent-over-correct` | **3** — catch early, at the boundary | **1** — make it unrepresentable |
| readers it binds | the **one** that remembered to call it | **every** reader, by construction |
| the `as` cast at the parse | stays, and needs a comment to excuse it | narrows to a genuine boundary, where it is legitimate |
| files it touches | 1 production + 1 suite | 1 type + 5 readers + 1 writer |

⇒ **A was taken**, and B is caught as
`.dream/v2026_09_25.fix.a-poke-row-may-declare-no-measurement-at-the-type-level.md`.

## .why A, at the time

the round's blocker is the **unaccounted spend**, and A closes it completely: the
measurement is read once, and a torn row rejects by name with the ledger position, the
attempt, and the reviewer in its metadata. the bill can no longer read low.

B closes the same blocker **and** removes the class — which is why it is the better
answer and not the answer for this round.

🔴 **and A is not a paper repair.** it is clamped by `[case8]`, and the clamp was
proven red: a fallback measurement in place of the throw goes **4 of 26** red. `[t2]` —
a `defer` row that legitimately carries `measured: null` — stays **green** under that
neuter, which is what proves the guard reads the ACT rather than merely the null.

## .why the rework is dirty

`WarmerPokeRow` is read at five sites the round did not otherwise open:
`runReviewWarmer`, `setOnePokeRow`, `isWarmerRowTerminal`, `getOneWarmerSpend`, and
`getOneWarmerCost`. a union changes the narrow-then-read obligation at each, so the
change ripples past the diff a single blocker opened
(`rule.always.fix-forward-under-scouts-honor`'s CLEAN question, answered **no**).

## 🟡 .why the confidence is 84% and not higher

the **ripple count is an estimate**, and that is exactly what this row exists to
surface. it came from a grep of the type name, so it counts the sites that NAME
`WarmerPokeRow` and not the sites that hold a value of it under another name. the true
number is ≥ 5, and a union that reached a sixth reader would make the deferral more
right, never less — so the direction of the error is known and the magnitude is not.

🔴 **and this board's own record is the reason to state that rather than round up.**
five prior rows here rested on an unverified premise (`F22`, `F27`, `F30`, `F33`, and
`F27`'s fork list), and in four of the five the premise was refutable by one command
nobody ran. the command here would be a read of all five call sites, and it was not
made — the blocker was closed, and the read is B's own first step.

## .what would overturn it

- a diff that opens the warmer subsystem's type file for another reason — then B is
  **clean**, and the deferral's only ground is gone (this is `F32`'s trigger shape: a
  **diff**, never a clock)
- a second torn-row defect at a reader other than `getOneWarmerCost` — that would prove
  the runtime guard's reach is the defect rather than a tolerable bound

## .the verdict, once ruled

_unruled._

## .see also

- the dream: `.dream/v2026_09_25.fix.a-poke-row-may-declare-no-measurement-at-the-type-level.md`
- the guard: `src/domain.operations/review/meter/getOneWarmerCost.ts` — `asPokeMeasurement`
- the clamp: `…getOneWarmerCost.integration.test.ts` `[case8]`, 3 `when` blocks
- `rule.prefer.prevent-over-correct` (the rung ladder this row grades on) ·
  `rule.forbid.as-cast` · `rule.forbid.failhide`
