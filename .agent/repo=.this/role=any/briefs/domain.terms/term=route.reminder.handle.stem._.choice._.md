# domain.term: stem

term.chosen   = stem
term.kind     = noun
term.boundary = route.reminder.handle
term.synonyms.forbidden:
- basename
- prefix

## .what
the **stem** of a reminder handle is the file name every extension of one clone's handle shares:
`daemon.of=reminder-driveon.session=<token>`, where the token is the clone address, escaped. the
clone handle and the legacy sweep name one clone by one stem.

## .refs
- src/domain.operations/route/reminder/asRouteReminderHandleStem.ts

## .reason
- `term=route.reminder.handle.stem._.choice.reason.md`
