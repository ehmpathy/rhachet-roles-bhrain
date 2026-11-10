# F6 — stale test: include the `$route` dir mtime, or only `.route/` ledgers

- **the fork:** (a) the stale test reads pr #700's whole allowlist, the `$route` dir mtime
  included; (b) it reads only the `.route/` ledgers (`passage.jsonl`, `reviewPeerMeters.jsonl`,
  promises) and the bind flag
- **taken:** (b), answered by code, not guessed. `computeNextStones.ts:23-26` picks the next stone
  from `artifact.passage` alone, and the phase reads blockers, meters, and promises — never yield
  files. so a new yield file is no render input, and (a) would mark the line stale on every first
  yield for no change in the line. `.stone` adds and removes go through `route.stone.add` / `del`,
  which become writers
- **rework:** clean — one list in the reader
- **confidence:** 95% — read from the render's own code
- **where:** `1.vision.yield.md`, the contract and open question 3
- **verdict:** answered by code, in the vision's self review
