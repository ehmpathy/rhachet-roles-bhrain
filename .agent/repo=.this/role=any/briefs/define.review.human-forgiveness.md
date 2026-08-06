# define.review.human-forgiveness

## .what

how a human forgives a stuck guard so a stone can pass. two moments, one intent — an **overrule**
(early, per-level) and an **exhaustion + approval** (late, batched) — plus the rule that ties them
together: **the judge is the top rung of the level ladder, and every overrule scopes to exactly one
rung.** there is no stone-wide, all-at-once forgiveness.

## .the ladder includes the judge

a guarded stone's gates form one ordered ladder:

```
peer level 1  →  peer level 3  →  …  →  judge
```

the **judge is the top rung**, not a gate outside the ladder. a level unlocks the next only once it
is terminal; the judge — the last rung — runs only once every peer level below it is terminal. a
**judges-only stone** (a guard with `judges:` but no `reviews.peer:`) is simply a ladder whose only
rung is the judge — active from the first step.

this is why there is **no** separate "stone-wide" forgiveness. the old `overruledAll` boolean
existed only because the judge was modeled *outside* the ladder; fold the judge in as the top rung
and the special case disappears. an overrule of a judges-only stone is just an overrule of its one
rung — the judge.

## .the invariant

```
every overrule forgives exactly ONE rung — never the whole ladder in one act
```

to pass a stone where every rung blocks, a human forgives each rung deliberately:

| stone | acts to pass when all rungs block |
|---|---|
| `l1 + l3 + judge` | overrule l1 → overrule l3 → overrule judge (**3 deliberate acts**) |
| judges-only | overrule judge (**1 act — the only rung**) |

you **cannot** leap to a higher rung to skip a lower one: a rung becomes the *active* (overrulable)
rung only once every rung below it is terminal (or itself overruled). so each overrule is scoped,
loud, and attributable — the safety the old skeleton-key boolean destroyed.

## .two moments of one act

a rung cannot pass on merit alone once it is stuck; a human forgives it. they may pay that cost
**early** or **late**:

| | **overrule** (early) | **exhaustion + approval** (late) |
|---|---|---|
| when | now, before the rung is terminal | after the reviewer spends its whole budget |
| intent | "i have seen enough — wave this rung **now**" | "let the reviewer run its full course first" |
| effect | the rung is clear-for-passage at once; the **next rung unlocks immediately** | the rung is terminal-via-exhaustion, but clear-for-passage only after the human's `--as approved` |
| cost | one act **per rung** | one `--as approved` covers **all** exhausted rungs at once |
| end-human? | **no** — the overrule *was* the human act | **yes** — the `--as approved` is the human act, paid at the end |

both reach the same terminal outcome. the overrule simply **pays early to unlock the next rung
sooner** — the sole reason to overrule l1 is to let l3 start *before* l1 would otherwise exhaust.

## .the key consequence — an early overrule removes the end-human for that rung

an overruled rung is **already clear-for-passage**. the end-of-ladder `--as approved` gate exists
**only** for rungs that reached terminal via **exhaustion** (the machine gave up, the human has not
yet decided). therefore:

- forgive every stuck rung **early** (overrule) → at the end, all rungs are already clear →
  `passage = overruled`, and **no end-human is needed**.
- let the rungs **exhaust** → the end `--as approved` is the human who pays **late**, once, for all
  of them.

the human never vanishes — they either pay per-rung early, or once at the end. what an early
overrule buys is a **sooner unlock** of the rung above, and the removal of the end-approval *for
what was overruled*.

## .the full experience suite

each rung reaches terminal one of four ways; the last column is what the human still owes:

| how the rung went terminal | unlocks next? | clear for passage? | human still owes |
|---|---|---|---|
| **approved** (merit) | yes | yes | not one act — clears autonomously |
| **overruled** (early human grant) | yes | yes | not one act — the overrule *was* the act |
| **exhausted** (budget spent) | yes | **no** | `--as approved` at the end |
| **malfunction / constraint** | yes | **no** | `--as overruled` the rung (the judge included, now that it is a rung) |

### the three journeys that fall out

- **patient** — let l1, l3 exhaust → the judge halts ("these exhausted, approve?") → one
  `--as approved` → pass. *(fewest acts, slowest — the human waits for every budget to spend.)*
- **eager** — overrule l1 early → l3 unlocks **now** → converge l3 on merit → overrule the judge if
  it blocks → pass with **no end-human**. *(fastest unlock, one act per stuck rung.)*
- **mix** — overrule l1 (to unblock l3 sooner), let l3 exhaust → at the end l1 is already forgiven,
  l3 still needs its `--as approved`. *(pay some early, some late.)*

## .why keep both moments

they serve genuinely different needs, so both stay:

- **early overrule** unlocks the next rung immediately — the driver is not blocked for rounds while
  a doomed lower reviewer burns its budget.
- **late approval** batches — one `--as approved` clears every exhausted rung at once, for a human
  who preferred to let the reviewers run their course.

the asymmetry is the feature: early-pay **unlocks**, late-pay **batches**.

## .enforcement

- a single human act that forgives more than one rung at once (the old `overruledAll` skeleton key)
  = **defect**. every overrule scopes to exactly one rung.
- a judge treated as a gate outside the level ladder (a special-case bypass branch) = **defect**.
  the judge is the top rung; it is overruled the same way any rung is.
- an overruled rung that still demands an end-of-ladder `--as approved` = **defect**. the overrule
  already forgave it.

## .see also

- `define.invariant.review.peer.passage.md` — PASS ⟺ every rung terminal (the gate this forgiveness
  operates within).
- `define.invariant.review.peer.exhausted.md` — exhausted ⟺ the review was skipped (the late-moment
  terminal state).
- `domain.terms/term=forgive._.choice._.md` — the canonical verb for what an overrule does.
- `domain.terms/term=terminal._.choice._.md` — terminal-for-unlock vs clear-for-passage.
- `define.passage-statuses.md` — only `passed` constitutes valid passage.
