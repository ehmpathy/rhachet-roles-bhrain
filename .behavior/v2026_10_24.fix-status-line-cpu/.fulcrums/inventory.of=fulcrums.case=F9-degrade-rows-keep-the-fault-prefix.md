# F9 — a degrade row keeps the `[route.status.line] fault:` prefix; an error row is qualified

- **the fork:** the status line writes three stderr rows. the renderer fault halts the line
  and exits non-zero. the phase degrade and the cache-write fault each print the line anyway and
  exit 0. (a) qualify all three with `✋ ConstraintError:` / `💥 MalfunctionError:` · (b) qualify
  the error row, keep the extant prefix on the two degrades
- **taken:** (b). the error row now opens with its class, by who must fix it, from one source
  (`asStatusLineFaultRow`, via `emitStatusLineFault`). a degrade throws no error and exits 0:
  it is a warn beside a correct line, so a class header would claim a failure that did not
  happen. the phase degrade's prefix is extant on `origin/main`; the cache-write row matches it
- **against:** `rule.require.qualified-error-headers` reads every human-read error; a reader
  may count a degrade as one
- **rework:** clean — two string constants and their snapshots
- **confidence: 75%**
- **where:** `statusLine/asStatusLineFaultRow.ts`, `statusLine/asStatusLineCacheWriteFaultRow.ts`,
  `route/stepRouteStatusLine.ts` (the phase degrade)
