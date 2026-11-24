# domain.term: reap

term.chosen   = reap
term.kind     = verb
term.boundary = route.reminder
term.synonyms.forbidden:
- kill
- purge
- cleanup

## .what
to **reap** a reminder daemon is to end it and clear its handle, as one act: signal the pid if it is
alive (SIGTERM), then remove the pid file only if it still names that pid. a reap of a dead pid is a
clear alone (`signalled: false`). a reap is idempotent: a second reap finds the handle absent.

## .refs
- src/domain.operations/route/reminder/delRouteReminder.ts                 # reaps the clone daemon
- src/domain.operations/route/reminder/delRouteReminderLegacyHandles.ts    # the sweep: reaps each legacy one
- src/domain.operations/route/reminder/isExpectedLegacyReapFault.ts        # which faults keep a handle
- src/domain.operations/route/reminder/asRouteReminderLegacyReapLines.ts   # the reap lines
- src/domain.operations/route/reminder/setRouteReminderLegacyReapLog.ts    # the reap lines, to the clone log

## .reason
- `term=route.reminder.reap._.choice.reason.md`
