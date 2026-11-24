# F15 — the reminder's status lines stay one flat line each, and name the halt reason beside its status

- **fork**: (a) one line per verb outcome, with clauses joined by `;` and the halt shown as `(route-not-live, status blocked)` · (b) a treestruct per outcome, with the status alone and no engine token
- **taken**: (a). every line here is grepped and appended to the clone log, word for word, by the same render that prints it (`asRouteReminderLegacyReapLines`, the gen and get lines). one line per fact keeps the log and the terminal alike. `route-not-live` is the exit reason the daemon logs (`reason=route-not-live`), so the `get` line names the same token the log does, and a human can grep the log by it. the status rides beside it because `route-not-live` spans four statuses (blocked, rewound, exhausted, malfunction)
- **rework**: clean — the lines are rendered at one seam per verb; a treestruct is a render change with no contract move
- **confidence**: 75% — a reviewer who weighs terminal reads above log greps would rule (b)
- **where**: `5.1.execution.from_vision` · round i007 · enroll-impl-behavior-intent nitpick.5 (item 5)
