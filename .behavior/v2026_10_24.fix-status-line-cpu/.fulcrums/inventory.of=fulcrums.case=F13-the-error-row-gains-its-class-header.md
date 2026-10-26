# F13 — the status line's error row gains its class header

- **the fork:** the vision's `.the fault contract` says a fault logs to stderr `exactly as today`,
  and today's row reads `[route.status.line] fault: <message>`. (a) keep that row byte for byte ·
  (b) open it with its class, `✋ ConstraintError: [route.status.line] …` for a multi-bind and
  `💥 MalfunctionError: [route.status.line] …` for any other fault, through one frame
  (`emitStatusLineFault`) that both entries read
- **taken:** (b). the row rides an exit 2 or a rethrow, so it is an error a human reads, and a
  mechanic rule requires every such row to name its class (`rule.require.qualified-error-headers`).
  the sense of the clause holds: a fault is never cached, it recomputes each repaint, and it
  reaches stderr loud. only the row's opener moved. stdout and every exit code are unchanged
- **against:** an approved vision clause, departed from in its letter. the vision yield is not
  rewritten by the driver, so the departure is held here for the council, as F5 and F12 hold theirs.
  the two exit-0 degrade rows keep the extant prefix (F9)
- **rework:** clean — `asStatusLineFaultRow` is one pure transformer; a reversal drops the header
  there and flips the multi-bind snapshot (`route.status.line - fault (multi-bind)`) and `[case20]`
- **confidence: 85%** — the rule is plain; the open part is whether the wisher meant the bytes or
  the behavior when they wrote `exactly as today`
- **where:** `statusLine/asStatusLineFaultRow.ts`, `statusLine/emitStatusLineFault.ts`,
  `contract/cli/route.ts`, acceptance `routeStatusLine` multi-bind snapshot and `[case20]`
