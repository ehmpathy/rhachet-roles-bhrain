# domain.term: orphan

term.chosen   = orphan
term.kind     = adj                  # the part of speech, reused across objects & operations
term.synonyms.forbidden:
- zombie
- leaked
- stray

## .what
a spawned RouteReminder daemon that could NOT be reaped — a live detached process loose on the
host, unaddressable by `get`/`del`, that nudges forever until a human intervenes.

## .refs
- src/domain.operations/route/reminder/RouteReminderOrphanError.ts

## .reason
see the ref-level cluster beside this choice:
- `term=orphan._.choice.reason.md` — etymology, disputes, evidence
