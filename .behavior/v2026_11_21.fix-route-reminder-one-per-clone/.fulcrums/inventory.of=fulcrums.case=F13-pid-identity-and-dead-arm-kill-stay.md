# F13 — the pid stays the daemon's identity, and the dead-arm reap keeps its kill

- **fork**: (a) land both here: a command-line identity check (`ps -p <pid> -o command=` must show the `route.reminder` daemon with this `--clone-addr`), which retires the EPERM fault class and most of `withRouteReminderProcessFaultMap`; and delete the dead arm's SIGTERM, with its focus gate and log wipe, so the daemon lingers on its own until its next tick · (b) keep both, and catch them as a dream
- **taken**: (b)
  - pid identity: the residual is a recycled pid that another process holds. it is bounded to two moments — a spawn's legacy sweep and an explicit `del` — and each one fails loud with the named fix (`kept`, EPERM) rather than signal blind. a `ps` probe is a new host boundary (its own output format per platform, its own fault class) on every liveness read, a larger surface than the residual it retires
  - dead-arm kill: the check-then-act window is one focus read wide. a drive that lands inside it loses its daemon for at most one hook turn: its own next drive re-findserts. to drop the kill instead keeps a daemon alive for up to one interval (20m) on a blocked route, which `get` reads as "live for now"; the wish wants a dead route never nudged, and the kill is what makes that immediate on the drive that blocked it
- **rework**: clean — each is a local change behind an extant operation; no caller depends on the kill or on the pid as identity
- **confidence**: 75% — a reviewer who weighs a smaller fault surface above a new host boundary would rule (a) on the identity check
- **dream**: `.dream/v2026_11_21.feature.route-reminder-trail-and-handle-lifecycle.md` (the identity check and the kill trade-off sit beside the handle lifecycle)
- **where**: `5.1.execution.from_vision` · round i004 · enroll-impl-arch-defects nitpick.3 (item 4), nitpick.4 (item 5)
