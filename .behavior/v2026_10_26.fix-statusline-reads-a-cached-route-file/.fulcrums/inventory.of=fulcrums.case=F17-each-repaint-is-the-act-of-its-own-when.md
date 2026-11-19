# F17 — each repaint is the act of its own when (5.3 ergo-contract-snapshots i003 nitpick.2 disputed)

## .the fork
- a: one hook runs the cold and the warm repaint together, so order is explicit
- b: the cold repaint is the act of `[t0]`, the warm repaint the act of `[t1]`, ordered by jest's declaration order of peer hooks

## .taken, why
b. the i002 mech-given-when-then blocker asked for exactly this: each act inside the `when` that names it. option a re-opens that blocker. jest runs a describe's `beforeAll` hooks in declaration order and never parallelizes within a file, so `[t1]` reads the cache `[t0]` wrote; the same holds in case6. if `[t0]` faults, its own thens go red first, so the failure is named, not hidden.

## .rework
clean: merge the two hooks into one, one file.

## .confidence
90%. two reviewers ask for opposite shapes; this keeps the one already settled by a blocker.

## .where
`.agent/repo=.this/role=any/skills/route.status.line.show.integration.test.ts` case9.

## .verdict
open — disputed in i003.
