# F226 — a snapshot pins a second copy by design

## .the fork

5.3 i002 r006 `ergo-snapshot-visual-blemishes` raised a nitpick: the `route.drive --help` text lives
in `src/contract/cli/route.ts` and again, verbatim, in `routeDriveHelp.test.ts.snap`, so *"the prose
will drift"*.

two answers: **(a)** concede, and collapse the two copies to one · **(b)** dispute: the second copy is
the snapshot's whole job

## .taken

**(b)**. a snapshot is a deliberate pinned copy of a contract's output
(`rule.require.snapshots`). it cannot drift silently: an edit to the help in `route.ts` turns
`routeDriveHelp.test.ts` red until the snapshot is re-pinned, and the re-pin lands in the diff a
reviewer reads. to remove the copy removes the clamp.

## .rework

**clean.** if the council wants the help asserted by fragments rather than whole, that is one test
file.

## .confidence

🟢 **95%** — the r006 repair to the same help re-pinned that snapshot through exactly this path,
2026-10-12: the edit to `route.ts` went red, `--resnap` showed an 11-line diff.

## .where

`src/contract/cli/route.ts` · `src/contract/cli/__snapshots__/routeDriveHelp.test.ts.snap`

## .verdict

unruled — awaits the council.
