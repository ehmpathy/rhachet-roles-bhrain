# F10 — the bind-vs-repaint racer may print either line

- **the fork:** `[case9][t2]` fires `route.bind.set` and a repaint at once. the racer prints the
  pre-bind blank or the new line, by which wins; both are correct. (a) assert membership in the
  two valid lines · (b) pin one outcome by an order the test forces, which removes the race the
  case exists to exercise
- **taken:** (a). neither member is an error: both are valid status lines, and the case
  asserts what matters — the NEXT repaint shows the new route, deterministically. the snapshot
  holds only the settled lines; the racer is left out of it
- **against:** `rule.forbid.failhide` (test) lists `expect([...]).toContain(x)`; its target is a
  set that admits an error code as a pass, which this set does not hold
- **rework:** clean — one assertion
- **confidence: 85%**
- **where:** `src/domain.operations/route/statusLine/stepRouteStatusLineCached.integration.test.ts`
