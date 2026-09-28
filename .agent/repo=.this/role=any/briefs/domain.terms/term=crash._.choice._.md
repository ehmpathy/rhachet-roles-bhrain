# domain.term: crash

term.chosen   = crash
term.kind     = noun                 # the part of speech, reused across objects & operations
term.synonyms.forbidden:
- die
- death
- fault

## .what
the unplanned death of a RouteReminder daemon process — observed from outside the process (a
`kill -0` that now fails), as opposed to a `fault`, which is a failure caught from inside a
tick that is still alive on the loop.

## .refs
- src/domain.operations/route/reminder/getRouteReminderCrashLogPath.ts
- src/domain.operations/route/reminder/setRouteReminderCrashLog.ts
- src/domain.operations/route/reminder/delRouteReminderLog.ts
- src/domain.operations/route/reminder/getRouteReminderLogPresence.ts
- src/domain.operations/route/reminder/verifyRouteReminderBootSurvival.ts (the crash-on-arrival case)

## .reason
see the ref-level cluster beside this choice:
- `term=crash._.choice.reason.md` — etymology, disputes, evidence
