# F52 — the cache-stability order keys on mtime, so a bulk touch reorders the corpus once

- **rework** = clean (one sort key, one function)
- **status** = 🟡 BEST-GUESSED 2026-09-26 — option A, keep mtime, state the residual
- **confidence** = 🟡 **80%**
- **raised** = 2026-09-26, from `arch-hazards-behavior` i004 nitpick.2. the lane itself grades the
  prior refutes *"sound"* and asks only that the residual stay visible

## .the fork, stated fairly

`getAllTargetsByCacheStability` sorts targets oldest-touched first, so the files least likely to
change lead the prompt and the shared prefix reaches as far as it can
(`rule.require.name-the-shared-prefix-as-the-cache-anchor`). the key is filesystem mtime.

| option | what it costs | what it buys |
|---|---|---|
| **A — mtime, as shipped** | a bulk touch (checkout, format sweep, fresh clone) re-stamps every file together; the next round reorders once, and its prefix is cold | temporal locality — a file edited this round sorts last, so the edit voids the least prefix |
| **B — content hash** | the order carries no signal about what will change next; an edit can land at the head and void the whole prefix | the order is stable across a bulk touch |
| **C — git last-commit time** | a subprocess per round; uncommitted edits (the common case on a route) share one stamp | stable across checkout; weak on uncommitted files |

## .taken, and why AT THE TIME

**A.** the order exists to predict what will still be byte-identical next round. mtime is the
only cheap signal that correlates with that. a bulk touch costs ONE cold round, then the order
re-converges; a hash key costs a partial miss on EVERY round in which a file near the head moves.

⇒ the loss under A is bounded and rare; the loss under B is small and constant. the measured
cache gain (i001→i002 at **28.5%** cached, `F40`) came from A.

## .why confidence is 80%, not higher

nobody has measured how often a bulk touch lands between two rounds of one lane. a route that
rebases or runs a formatter each round would pay A's cost every round — at which point B wins.
the trigger to revisit: a `review._.cost --of tree` row whose cache rate drops to ~0 on a round
that follows a checkout or a `npm run fix`.

## .where

- `src/domain.operations/review/getAllTargetsByCacheStability.ts` — the sort, and its `.note`
  on the bulk-touch case
- `src/domain.operations/review/getAllTargetsTouchedAt.ts` — the mtime read

## .the verdict, once ruled

_(open — the wisher's)_
