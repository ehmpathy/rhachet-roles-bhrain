# domain.term: focus

term.chosen   = focus
term.kind     = noun
term.boundary = route.reminder
term.synonyms.forbidden:
- target
- current route
- active route

## .what
the **focus** of a clone's RouteReminder is the one route that reminder nudges about: the route
the clone drives now. each drive writes it; the daemon reads it each tick. a clone with many
routes bound or stacked holds one focus, so it gets one nudge per interval.

## .refs
- src/domain.operations/route/reminder/setRouteReminderFocus.ts      # the drive points the reminder at its route
- src/domain.operations/route/reminder/getRouteReminderFocus.ts      # the tick and `get` read it
- src/domain.operations/route/reminder/isRouteReminderFocusOn.ts     # the race gate: does the focus still name this route?
- src/domain.operations/route/reminder/getRouteReminderFocusPath.ts  # the `.focus` file in the clone home
- src/domain.operations/route/reminder/asRouteReminderFocusLabel.ts  # the human label of a focus route

## .reason
- `term=route.reminder.focus._.choice.reason.md`
