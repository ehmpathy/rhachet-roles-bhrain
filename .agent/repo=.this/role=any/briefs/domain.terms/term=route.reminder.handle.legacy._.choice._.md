# domain.term: legacy

term.chosen   = legacy
term.kind     = adj
term.boundary = route.reminder.handle
term.synonyms.forbidden:
- old
- stale
- orphan

## .what
a **legacy** handle is a reminder handle at the per-route home a release before one-per-clone wrote:
`<route>/.route/<stem>.pid`. its daemon, if alive, nudges beside the clone daemon until the sweep
reaps it.

## .refs
- src/domain.operations/route/reminder/delRouteReminderLegacyHandles.ts    # the sweep
- src/domain.operations/route/reminder/isExpectedLegacyReapFault.ts        # which faults keep one
- src/domain.operations/route/reminder/asRouteReminderLegacyReapLines.ts   # the reap lines
- src/domain.operations/route/reminder/setRouteReminderLegacyReapLog.ts    # the reap lines, to the clone log

## .reason
- `term=route.reminder.handle.legacy._.choice.reason.md`
