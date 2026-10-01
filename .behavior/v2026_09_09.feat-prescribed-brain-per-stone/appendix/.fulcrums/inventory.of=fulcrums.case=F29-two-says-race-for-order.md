# fulcrum F29 — the two says RACE for order, so `/effort` may land before `/model`

**raised** 2026-09-25, at the execution stone — the `/effort` fan-out made a second say real
**rework** = ✅ clean · **status** = open · **confidence** = 80%

## .the fork, stated fairly

`/model` and `/effort` are two slash commands the brain-cli cannot be handed as one, so a guard that
declares both axes produces **two says**. this operation spawns both as detached children and returns
at once — it must, because a hook that waits on a `clone say` deadlocks against the very driver that
would answer it (`case=5`).

⇒ **so neither say is awaited, and their order on the wire is decided by neither.**

🟡 **the bytes are safe, and that is a separate guarantee.** rhachet's per-clone write queue is a
single writer — *"two concurrent `say`s must never interleave into the child's input. one writer, one
order: each message is written whole before the next starts"* (`genCloneWriteQueue`). so no message
is garbled. what the queue serializes by is **connect order**, and two children spawned microseconds
apart race to connect.

| | the choice |
|---|---|
| **taken** | spawn the brain say FIRST, and accept that it lands first in practice rather than by guarantee |
| **rejected A** | await the first child's exit before the second spawns — reintroduces the `case=5` deadlock shape, and a 15s verify per say |
| **rejected B** | fuse both into one multi-line `--what` — 🔴 not available: rhachet wraps an interior newline in bracketed paste and commits the block as ONE turn (`asCloneDispatchFrame`), so it arrives as a two-line message rather than two commands |
| **rejected C** | one wrapper say that the brain expands — no such surface exists on the brain-cli |

## .what was taken, and why

**the argument is that the spawn order is the only lever available, and it is enough in practice.**

- the brain say is spawned first, so it wins the connect race on every ordinary schedule
- rejected A buys a guarantee with the one deadlock this whole design is shaped to avoid
- rejected B was checked at source rather than assumed, and the frame contract refuses it
- a re-dispatch is convergent (`F14`), so the next entry tick re-sends both in the same order

## 🔴 .the counter-case, and it is real

**an `/effort` that arrives FIRST is applied to the brain the guard was written to replace.**

effort is model-scoped. so an out-of-order pair sets a level on the brain the stone is about to leave,
then switches brains — and the new brain runs at whatever level it defaults to, which is the one
outcome an explicit `effort:` declaration exists to prevent.

⚠️ **and it is silent.** no surface reads the live effort back (`F5` covers the brain alone), so a
mis-ordered pair renders exactly as a correct one. the record claims `requested` for both axes, and
one of them was applied against the wrong subject.

🟡 the harm is **bounded by the next tick** — the stone re-dispatches on re-entry and the order is
re-rolled — but bounded is not absent, and a stone entered once is dispatched once.

## .why it is clean

the repair is confined to this one operation's body. `dispatchOneSay` already takes its `what` whole,
so an ordered arm is a `then` on the first child's exit rather than a new seam — no contract moves,
no caller changes, no snapshot shifts. the cost of an ordered arm is **latency and the `case=5`
deadlock risk**, never ripple.

## .where

- `src/domain.operations/route/brain/dispatchBrainSwitch.ts` — the two spawns, and the note that admits the race
- `src/domain.operations/route/brain/dispatchBrainSwitch.integration.test.ts` — `[t1]`, whose assert is SORTED precisely because this order is unguaranteed
- `node_modules/rhachet/dist/.../genCloneWriteQueue.js` — the single-writer contract that makes the bytes safe
- `node_modules/rhachet/dist/.../asCloneDispatchFrame.js` — the bracketed-paste frame that refuses rejected B

## .confidence, and why

**80%.** what is measured: that the fan-out is two says, that the queue is a single writer, that a
multi-line `--what` commits as one turn, and that the brain say is spawned first. what is a judgment
is **how often the race is lost** — nobody has counted, and the test asserts a sorted set precisely
because an ordered assert would pin a property the code does not claim.

⚠️ the residual 20% is one gap: the harm's true cost depends on whether the brain-cli **retains** an
effort level across a `/model` switch. if it resets on switch, an out-of-order pair is merely a lost
effort rather than a mis-applied one — a materially smaller harm, and one observation settles it.

## .the verdict, once ruled

*(open)*
