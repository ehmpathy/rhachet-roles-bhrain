# F3 — the drive reaps legacy per-route handles under `.behavior/*/.route/`

- **fork**: (a) sweep `.behavior/*/.route/daemon.of=reminder-driveon.session=<this token>.pid` on each sync · (b) no sweep; legacy daemons self-exit on their own doors · (c) a one-shot `route.reminder.del --legacy` a human runs
- **taken**: (a). without it, the upgrade day still shows the double poke the wish forbids, until each old route dies. the glob spells the literal `.route` segment (a `**` will not cross a dot dir) and stays depth-one, so no `node_modules` walk. compare-and-delete per handle, scoped to this clone's token
- **rework**: clean — one leaf, removable once no legacy handle can exist
- **confidence**: 80% — routes outside `.behavior/` are not swept; their legacy daemons fall back to (b)
- **where**: `1.vision.yield.md` · the solution, move 3 · `case=3`
- **verdict**: round i002 (enroll-impl-behavior-intent nitpick.4) checked other route roots: this repo keeps routes under `.route/` too. the sweep now reads `.behavior/*/.route/` and `.route/*/.route/`, and runs from two callers only: before a spawn (past the findsert fast path) and on the `del` cli. round i003 (enroll-impl-arch-defects blocker.1) took it off the drive's reap arm, which a blocked route fires each turn; the sweep header names its removal condition