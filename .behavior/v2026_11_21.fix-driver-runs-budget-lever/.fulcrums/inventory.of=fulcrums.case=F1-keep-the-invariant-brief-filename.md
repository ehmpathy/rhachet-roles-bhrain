# F1 — keep the invariant brief's filename; rewrite its body

## .the fork

`define.invariant.review.peer.judge.urgent-guides-the-budget-ask` now names an "ask" the judge no longer prints. options:

- **a.** keep the filename, rewrite the body: the judge guides the driver to the budget top-up, plus a note to its human
- **b.** rename it, e.g. `…urgent-guides-the-budget-topup`, and update `boot.yml`, the boot snapshot, `define.invariant.review.peer.passage.md`, and the code comments that cite it

## .taken, why

a. the "ask" still holds in part: the driver asks itself, and owes its human a note. a rename spreads into the boot clamp and several citations. that ripple belongs to a sweep, which the rules forbid as a side effect of an unrelated fix.

## .rework

clean: a rename later touches only citations, with no behavior change.

## .confidence, why low

80%: a name that half-fits is a slow decay. a reviewer may well prefer b.

## .where

`src/domain.roles/driver/briefs/define.invariant.review.peer.judge.urgent-guides-the-budget-ask.md`

## .verdict

redirected by the foreman to b: renamed to `define.invariant.review.peer.judge.urgent-guides-the-budget-grant`. the old name says "ask" where its body and its peers say "a warn, never an ask", and a stale name kept to spare a one-time citation update is a migration exception. `grant` is the canonical term (F6). the 10 citations, all under `src/`, moved with it: `driver/boot.yml`, the `roleBootClamps` snap, `define.invariant.review.peer.passage.md`, and the code docblocks.