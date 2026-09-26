# domain.term.choice.reason: breaker

## .etymology
`breaker` names the standard "circuit-breaker" resilience pattern — a counter that trips open
once a failure threshold is reached, then blocks further attempts until reset. `RouteReminderCrashBreaker`
counts consecutive daemon `crash`es on disk (a byte-count file) and refuses a re-spawn once
`MAX_ROUTE_REMINDER_CRASHES` is reached (surfaced to the human as `CIRCUIT-BROKEN`). rejected
`limiter` (implies a rate cap on volume, not a failure-count trip) and `guard` (already the
canonical name for a route's own passage gate — a distinct concept, `1.vision.guard`).

## .disputes
none raised.

## .evidence
- discovery: `MAX_ROUTE_REMINDER_CRASHES` bounds the count; `bumpRouteReminderCrashBreaker`
  increments on each observed daemon crash; `getRouteReminderCrashBreaker` reads the count for
  the `route.reminder.get` cli surface's "CIRCUIT-BROKEN" report.
- invariant: the breaker persists across daemon re-spawns (a file on disk, not in-process state),
  so a rapid boot-crash-boot-crash loop trips even though no single process lives long enough to
  count its own crash.
