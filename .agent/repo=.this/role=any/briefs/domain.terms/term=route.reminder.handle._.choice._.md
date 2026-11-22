# domain.term: handle

term.chosen   = handle
term.kind     = noun
term.boundary = route.reminder
term.synonyms.forbidden:
- lock
- lockfile
- registry entry

## .what
the **handle** of a clone's RouteReminder is the set of files that address its one daemon: the
`.pid` (which process), the `.log` (its watched trail), the `.crashes` (the crash breaker), and the
`.focus` (the route it nudges about). one handle per clone, in the clone home.

## .refs
- src/domain.operations/route/reminder/getRouteReminderHandlePath.ts   # one builder per extension
- src/domain.operations/route/reminder/setRouteReminderHandleDir.ts    # the clone home findsert
- src/domain.operations/route/reminder/asRouteReminderHandleStem.ts    # the clone's file stem

## .reason
- `term=route.reminder.handle._.choice.reason.md`
