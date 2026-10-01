# F29 — `/model` and `/effort` are two says that race for order

**rework** = clean · **status** = ruled — order does not matter · **confidence** = 80%

## .the fork

a guard that declares both axes produces two says, spawned detached and never awaited — a hook that
waits on `clone say` deadlocks against the driver that would answer it (`case=5`). rhachet's
per-clone write queue is a single writer (`genCloneWriteQueue`), so no message is garbled; it orders
by connect, and two children spawned microseconds apart race to connect.

| option | verdict |
|---|---|
| **spawn the brain say first** | taken — it wins the race on every ordinary schedule |
| A — await the first before the second | refused: the `case=5` deadlock shape, plus a 15s verify per say |
| B — one multi-line `--what` | not available: rhachet frames an interior newline as one bracketed-paste turn (`asCloneDispatchFrame`) |
| C — one wrapper say the brain expands | no such brain-cli surface |

a re-dispatch is convergent (`F14`), so the next entry re-sends both in the same order.

## .the counter-case

effort is model-scoped. an `/effort` that lands first sets a level on the brain the stone is about to
leave, and the new brain runs at its default — silently, since no surface reads the live effort back.

## .rework

clean — an ordered arm is a `then` on the first child's exit inside `dispatchBrainSwitch`; no contract
or snapshot moves. its cost is latency and the deadlock risk, never ripple.

## .confidence — 80%

nobody has counted how often the race is lost (`dispatchBrainSwitch.integration.test.ts` `[t1]`
asserts a sorted set for that reason). one observation shrinks the harm: whether the brain-cli resets
effort on a `/model` switch — if so, an out-of-order pair loses the level rather than misapplies it.

## .the verdict

ruled by the wisher: *"doesnt matter about order"* (`.seeds/inventory.of=seeds.case=S11-say-order-does-not-matter.md`).
the taken arm stands — brain say first, both unawaited. no ordered arm is built.
