# F32 — an op snapshot pins the error the op throws

- **the fork:** `stepRouteStatusLineCached`'s multi-bind case pins `BadRequestError: …` with its
  metadata, while the cli snapshots pin the qualified row `✋ ConstraintError: [route.status.line]
  …`. (a) render the op's error through the row in the op test · (b) keep each grain's own output
- **taken:** (b). the op's contract is to throw the bind fault with its metadata, never cached
  (F9, the forbidden cell). the row is the cli's render of that throw, made once by
  `asStatusLineFaultRow` and pinned in its own unit snapshot and in the `routeStatusLine`
  acceptance. to render the row in the op test would pin the cli's output at the op's grain, and
  the metadata a human needs to unbind the extra route would drop out of the op's clamp
- **rework:** clean — a snapshot edit
- **confidence: 85%**
- **where:** `src/domain.operations/route/statusLine/__snapshots__/stepRouteStatusLineCached.integration.test.ts.snap`
