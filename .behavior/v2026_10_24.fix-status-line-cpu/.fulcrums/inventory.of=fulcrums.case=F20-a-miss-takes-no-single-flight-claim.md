# F20 — a miss takes no single-flight claim

- **the fork:** while one repaint renders a miss, later repaints of the same seat (and of peer seats
  on one branch) also miss and render. (a) let each miss render; the atomic rename makes every
  write a valid record · (b) a single-flight claim: the first miss holds a key, the rest print the
  stale record's line and exit
- **taken:** (a). a claim another process checks is a lock, and a lock here must be a
  `withSimpleMutex` call (`rule.require.locks-via-with-simple-mutex`); a hand-rolled `O_EXCL` file
  with a pid is forbidden (`rule.forbid.hand-rolled-locks`). the mutex's disk cache would load on
  the hit path, the cost the wish removes. the pile-up is bounded: a miss costs ~0.5s of cpu, it is
  paid once per passage change, and each cancelled render runs at most the 5s grace. acceptance
  `[case18]` holds 12 concurrent processes to one valid record
- **against:** on a starved box a miss spans several repaints, so a passage change can cost a few
  overlapped renders per seat; no bench arm measures that overlap. a SIGKILL cancel makes the grace
  inert (the render dies, as before the fix)
- **rework:** clean — a try-once `withSimpleMutex` around the miss, its cache lazy-loaded on the
  miss path only; losers print the prior record's line
- **confidence: 75%**
- **where:** `statusLine/stepRouteStatusLineCached.ts`, `contract/cli/route.status.line.ts`
