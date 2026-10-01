# F6 — a switched brain is sticky, never restored on stone exit

**rework** = clean · **status** = open · **confidence** = 80%

## .the fork

a stone switches to opus and passes; the next stone declares no brain.

- **sticky** — the driver stays on opus
- **restore-on-exit** — the driver drops back to the brain it launched on

## .taken, and why

**sticky, with attribution.**

- it matches the wish: *"a stone with no `brain:` field keeps the inherited brain"* — after a switch,
  the inherited brain is the switched one
- it holds no state — the live brain IS the state. restore must remember a prior brain and replay it,
  and every halt, block, or rewind is a path where the restore silently does not fire
- the failures are asymmetric: sticky runs a stone richer than needed (costly, never wrong); a broken
  restore leaves the recorded state false (wrong, and silent)

## .the counter-case — the cost leak is structural

the hard stones are vision and blueprint; every stone from the roadmap onward is mechanical (`S7`).
so the mechanical region is the body of **every** route, and a sticky rich brain bills most of the drive.

⇒ the economy lives in the drop back at the roadmap, and that half belongs to bhuild's guard
templates: they must stamp the **cheap** brain on routine stones, not only the rich one on hard stones.
if that work slips, sticky is strictly worse than restore in the interim.

## .rework

clean — restore is additive: keep a prior brain, dispatch it on exit.

## .where

`1.vision.experience.case=7.the-next-stone-declares-none.md`

## .the verdict

open.

⇒ the full entry: `../appendix/.fulcrums/inventory.of=fulcrums.case=F6-brain-is-sticky-not-leased.md`
