# domain.term: daemon

term.chosen   = daemon
term.kind     = noun                 # the part of speech, reused across objects & operations
term.synonyms.forbidden:
- worker
- background-job
- service

## .what
a detached background process, spawned once per driver session, that ticks on a wall-clock
interval to nudge a stalled drive and self-exits the moment the route or session dies.

## .refs
- src/domain.operations/route/reminder/runRouteReminderDaemon.ts
- src/domain.operations/route/reminder/spawnRouteReminderDaemon.ts
- src/domain.operations/route/reminder/getRouteReminderDaemonSpawnPlan.ts
- src/contract/cli/route.reminder.ts (routeReminderDaemon)

## .reason
see the ref-level cluster beside this choice:
- `term=daemon._.choice.reason.md` — etymology, disputes, evidence
