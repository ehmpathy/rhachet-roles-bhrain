# fulcrum F9 — a settled block flushes in DECLARED order, never in settle order

| field | value |
|---|---|
| **case** | F9 |
| **title** | a settled block flushes in declared order, never in settle order |
| **rework** | clean |
| **status** | open — taken, and offered for a ruling |
| **confidence** | **90%** |
| **where** | `genContextCliEmit.ts` — the review event handler |
| **raised** | 2026-09-09, at the first acceptance run of the concurrent walk |

## .the fork

under a concurrent pour, two lanes settle in a race. the live emit stream must decide what to do
with the block of a lane that lands out of declared order.

| option | what an onlooker sees | deterministic? |
|---|---|---|
| **A — settle order** | a block appears the instant its lane lands | 🔴 **no** |
| **B — declared order, buffered** | a block appears once every earlier lane in its level has landed | ✅ yes |
| C — declared order, at level end | no block until the whole level settles | ✅ yes |

## .taken — B, and why

🔴 **A is what the vision's own case 8 drew**, and it is the option i am overriding. c8's render
shows r2's block appended at 42.2s, before r1's. so this fulcrum exists because **the execution stage
found a constraint the vision did not have.**

> **the live stream is snapshotted.** `route.ts:980` hands `process.stdout` to a parameter named
> `stderr`, so the `🦉 the way speaks for itself` block is captured by every peer acceptance test.

⇒ under A, **36 snapshots become a coin flip.** that is no cosmetic regression; it is a test suite
that fails intermittently for a reason no reader can diagnose from the diff.

**C was rejected because it is a worse render for no extra determinism.** with no block until the
level ends, the tail status line's `done` counter would sit at `0` for the whole pour, and the one
constraint the wisher stated most plainly — *"we want to know how many are left too"* — would report
the same number every tick until the end.

## .what B costs, stated fairly

a fast lane behind a slow one waits for its block. at `concurrency: 1` that is no cost at all (the
order is the pour order). at a wide level with one slow first-declared lane, every other block is
held until it lands.

⚠️ **the tail status line does NOT wait.** `done` ticks the instant a lane settles, so an onlooker
still sees progress in real time — they see the *count* move before they see the *block*. that is
what makes the cost bearable, and it is the reason C is worse rather than merely slower.

## .why the wisher's three constraints survive

the constraints (seed S2) were about the **status line**, never about block placement:

| the constraint | is it touched by B? |
|---|---|
| *"we can only overwrite the last line in a review spinner"* | no — one tail line, unchanged |
| *"we require the spinner to say how long all has been inflight"* | no — the level's clock, unchanged |
| *"we want to know how many are left too"* | no — `done` still ticks on settle, not on flush |

⇒ **B changes only WHEN a block appends. it changes no field the wisher specified.**

## .the rework, and why it is clean

the buffer is local to the emit path: a map of index → lines, plus a cursor for the next index owed.
to switch to A is to delete the buffer and flush on arrival. no caller changes, no contract changes,
no artifact changes.

## .what would overturn it

- the live stream stops to be snapshotted — then A's nondeterminism costs naught, and A is the
  better render
- a wisher who says the instant-append is worth the flake, and accepts a sanitizer over the live half

## .the verdict, once ruled

*(unruled)*
