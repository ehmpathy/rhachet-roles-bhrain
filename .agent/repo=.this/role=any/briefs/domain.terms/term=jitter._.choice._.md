# domain.term: jitter

term.chosen   = jitter
term.kind     = noun
term.synonyms.forbidden:
- stagger
- wobble
- fuzz
- skew
- noise

## .what
**jitter** is the bounded random offset applied to a RouteReminder daemon's sleep interval, so a
fleet of daemons that register together does not tick in lockstep. each cycle the daemon sleeps
`intervalMs` scaled by a random factor within `±ratio` (default ±10%), so periodic ticks
decorrelate across daemons and a `rhx clone say` burst does not pile onto each interval boundary.

jitter names the OFFSET concept, not the cadence itself: the reminder's base cadence is the
interval (~20min, vision Q2); jitter is the small random perturbation ON that interval. it is the
vision's "off-minute to avoid fleet clusters" decision, made concrete.

## .refs
where the term composes declared operations:
- src/domain.operations/route/reminder/getRouteReminderJitteredMs.ts   # the jitter transformer + DEFAULT_REMINDER_JITTER_RATIO
- src/domain.operations/route/reminder/runRouteReminderDaemon.ts       # sleeps a jittered interval each cycle

## .reason
see the ref-level cluster beside this choice:
- `term=jitter._.choice.reason.md` — etymology, why `jitter` over `stagger`, and the vision-Q2 evidence
