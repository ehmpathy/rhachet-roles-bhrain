# domain.term: survival

term.chosen   = survival
term.kind     = noun                 # the part of speech, reused across objects & operations
term.synonyms.forbidden:
- uptime
- liveness
- health

## .what
whether a freshly-spawned RouteReminder daemon is still alive after a boot-settle window — a
boot-time check, distinct from `liveness` (`getRouteReminderLiveness`), which reads an
already-established daemon's current alive/dead state at detect time.

## .refs
- src/domain.operations/route/reminder/verifyRouteReminderBootSurvival.ts

## .reason
see the ref-level cluster beside this choice:
- `term=survival._.choice.reason.md` — etymology, disputes, evidence
