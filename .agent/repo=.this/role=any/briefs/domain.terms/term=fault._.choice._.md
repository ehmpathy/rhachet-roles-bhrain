# domain.term: fault

term.chosen   = fault
term.kind     = noun                 # the part of speech, reused across objects & operations
term.synonyms.forbidden:
- error
- exception
- crash

## .what
a classified, expected way the RouteReminder daemon's own tick can fail (its `say` call times
out, its process-level operation exits non-zero) — distinct from `crash`, which names the
process's own death, not a caught failure inside a live process.

## .refs
- src/domain.operations/route/reminder/asRouteReminderProcessFaultError.ts
- src/domain.operations/route/reminder/asRouteReminderSayFaultMessage.ts
- src/domain.operations/route/reminder/surfaceRouteReminderFault.ts

## .reason
see the ref-level cluster beside this choice:
- `term=fault._.choice.reason.md` — etymology, disputes, evidence
