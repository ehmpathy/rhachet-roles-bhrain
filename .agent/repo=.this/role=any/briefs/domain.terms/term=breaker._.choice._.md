# domain.term: breaker

term.chosen   = breaker
term.kind     = noun                 # the part of speech, reused across objects & operations
term.synonyms.forbidden:
- limiter
- guard
- throttle

## .what
the circuit-breaker record that counts consecutive `crash`es of a RouteReminder daemon and
trips once `MAX_ROUTE_REMINDER_CRASHES` is reached, so a daemon that crashes on repeat does not
get re-spawned into a storm on the host.

## .refs
- src/domain.operations/route/reminder/RouteReminderCrashBreaker.ts
- src/domain.operations/route/reminder/bumpRouteReminderCrashBreaker.ts
- src/domain.operations/route/reminder/getRouteReminderCrashBreaker.ts
- src/domain.operations/route/reminder/getRouteReminderCrashBreakerPath.ts
- src/domain.operations/route/reminder/delRouteReminderCrashBreaker.ts
- src/domain.operations/route/reminder/MAX_ROUTE_REMINDER_CRASHES.ts

## .reason
see the ref-level cluster beside this choice:
- `term=breaker._.choice.reason.md` — etymology, disputes, evidence
