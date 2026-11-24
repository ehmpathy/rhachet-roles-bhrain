# domain.term.choice.reason: reap

## .etymology
`reap` is the unix word for the act a parent owes a child that has ended: collect it, so no trace of
it lingers. the reminder's act is the same shape at the handle grain: end the daemon, and collect
the file that names it, so no handle outlives its process. the word was in use in this module (the
drive's dead arm "reaps" the daemon) before it named a typed outcome.

rejected:
- `kill` — names the signal alone. a reap of a dead pid sends no signal and still clears the file
- `stop` — `stopProcess` already names the signal step; a reap is stop plus clear. `del`'s own line
  says `stopped` for the signal it sent, which is the narrower act
- `purge` / `cleanup` — name the file half alone, and read as bulk. a reap is one handle, one pid
- `sweep` — kept, for a different concept: the sweep is the pass over every legacy home; each step
  of it is a reap

## .disputes
none.

## .evidence
- the outcomes a reap yields, each typed in `RouteReminderLegacyReapOutcome`: `absent` (no file) ·
  `reaped` with `signalled: true` (a live daemon ended) · `reaped` with `signalled: false` (a dead
  pid's file cleared) · `kept` (an expected fault, e.g. EPERM or a torn file; the file stays, the
  fix is named)
- invariants: a reap removes a pid file only if it still names the pid it read (compare-and-delete,
  `delRouteReminderPidHandleIfPidAt`) · a reap never signals a pid whose kill probe says EPERM (a
  recycled pid owned by another user) · a reap of an absent handle is a no-op
