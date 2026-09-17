# F02 · two new `--as` statuses, not a flag on `--as contemplated`

- **rework** = clean · **confidence** = 78% · **status** = best-guessed

## .the fork

the wish leaves the shape open: *"whether the two words are literal angle-bracket tokens or a flag
on an extant verb — all yours."*

| option | shape |
|---|---|
| **A** | `--as disputed --with <slug>` / `--as conceded --with <slug>` — two new statuses |
| **B** | `--as contemplated --that <slug> --stance dispute\|concede` — a flag on the extant verb |
| **C** | literal `<dispute>` / `<concede>` tokens inside the `.taken` body |

## .taken, and why

**option A.**

- **the wish's boundary forbids B outright.** *"a `<dispute>` is a verdict on the disagreement; it
  does not discharge the duty to answer each point."* a flag on `--as contemplated` fuses the answer
  and the verdict into one act, so a driver could declare a stance and satisfy the `.taken` gate in
  the same keystroke. **the two must be separately gated**, and A gives the answer-first invariant a
  place to live (`case=3`).
- **C is unenforceable at rung 1.** `setStoneAsContemplated` tests that the `.taken` **exists**, not
  what it says (`rule.forbid.unanswered-exits-from-a-blocker`: *"an empty or token `.taken` … ⛔
  open — existence is asserted, never content"*). a token inside a file body inherits that hole and
  is invisible to `passage.jsonl`.
- **A puts the stance in the passage ledger.** `PassageReport.status` is the append-only record a
  council and a `route.drive` both read. that is where a countable signal belongs, and countability
  is the wish's stated value: *"the signal is the value, never the permission."*

## .rework, and why

**clean.** `PassageReport.status` is a union type; a value added or removed is a compile-time move.
the CLI dispatch already switches on `--as`. to fold into B later would be a rename plus one gate
merge.

## .confidence, and why it is 78%

the boundary clause makes A near-forced. the 22% sits in a shape this fork did not weigh: whether
the stance belongs on **`--as arrived`** instead — *"i re-arrive, and here is my stance on each
open lane"* — which would carry it on the move that actually asks to proceed.

⇒ **why it was set aside:** an arrival is stone-scoped and a stance is reviewer-scoped (F01), so it
would need a repeated flag, and a driver with a stance on one lane but not another could not express
it. **recorded rather than dismissed** — a reviewer who prefers that shape should read this row.

## .where

`1.vision.yield.md` § *the contract*

## .the verdict

_not yet ruled._
