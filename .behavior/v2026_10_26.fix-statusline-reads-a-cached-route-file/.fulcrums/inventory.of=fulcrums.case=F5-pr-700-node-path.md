# F5 — pr #700's node entry: retire, or keep

- **the fork:** (a) retire the `cli/route.status.line` node entry once the bash reader ships;
  (b) keep it
- **taken:** (b), answered by logic, not guessed. a seat whose settings predate the upgrade still
  runs `node -e …` until `rhx init` rewrites its statusLine, through either the
  `cli/route.status.line` subpath or the legacy `cli/route` export that forwards to it. to retire it
  would blank those seats. its per-branch cache stays its own: the bash reader's pointer took a
  separate file (F9)
- **the third caller, at execution:** `route.status.line.show`, a repo-local dev skill at
  `.agent/repo=.this/role=any/skills/`, spawns the node entry to time one repaint. it shares the
  cache dir with the bash reader's pointers, so its `--drop` now removes the node records alone
  (`branch=*.json`), clamped by its case10
- **rework:** clean — the entry stays in place; a retire later deletes the entry, its cache, and
  its acceptance suite
- **confidence:** 95%
- **where:** `1.vision.yield.md`, open question 2
- **verdict:** answered by logic, in the vision's self review
