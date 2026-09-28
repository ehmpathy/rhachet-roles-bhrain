# domain.term: reminder

term.chosen   = reminder
term.kind     = noun
term.synonyms.forbidden:
- nudge
- poke
- tick
- heartbeat

## .what
a **reminder** is a scheduled prose nudge — "you can do it! drive on, fulcrum, and converge" —
injected into a driver session to keep a stalled drive in motion (past an api outage or a brain
hesitancy). a **RouteReminder** is a reminder bound to one route + driver session; it rides an
external self-exit daemon that reads route-state + session-liveness each tick and exits itself
when the drive is dead or parked (the wish's no-infiniloop guarantee).

the term names the CONCEPT, not the payload text (`nudge`) nor the wall-clock cycle (`tick`):
a reminder holds only while its payload is human prose. a deterministic command payload would be
a `tick`, not a reminder — see `.reason`.

## .refs
where the term composes declared operations:
- src/domain.operations/route/reminder/genRouteReminder.ts        # register (findsert the daemon handle)
- src/domain.operations/route/reminder/getRouteReminder.ts        # detect (is it set + live)
- src/domain.operations/route/reminder/delRouteReminder.ts        # deregister (stop + clear handle)
- src/domain.operations/route/reminder/getRouteReminderPidPath.ts  # the per-session handle path
- src/domain.operations/route/reminder/getRouteReminderLiveness.ts # read route liveness for the exit decision
- src/domain.operations/route/reminder/isReminderLiveForPassageStatus.ts  # the pure exit predicate
- src/domain.operations/route/reminder/stepRouteReminderTick.ts    # one tick: inject or exit
- src/domain.operations/route/reminder/runRouteReminderDaemon.ts   # the daemon loop
- src/domain.operations/route/reminder/REMINDER_NUDGE_PROSE.ts     # the nudge payload constant

## .reason
see the ref-level cluster beside this choice:
- `term=reminder._.choice.reason.md` — etymology, the wisher's coinage, and the settled
  Reminder-vs-RouteTick dispute (why the payload fork keeps this word)
