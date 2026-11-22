# domain.term.choice.reason: handle

## .etymology
`handle` = that by which an object is grasped. the files do not hold the daemon; they let a caller
reach it: signal it, read its trail, judge its crashes, point it at a route. the word predates this
change (`getRouteReminderHandlePath`); this entry records it.

rejected:
- `lock` / `lockfile` — a lock guards a critical section that another actor waits on. no actor
  waits on the reminder's pid file; it addresses a detached process (fulcrum F6)
- `registry entry` — names the store, not the grasp

## .disputes
### dispute: lock  —  raised 2026-11-21  —  status: OPEN (council, fulcrum F6)
- raised.by  = repo-rules review, round i001
- claim      = a pid file one actor writes and another checks is a hand-rolled lock
  (`rule.forbid.hand-rolled-locks`)
- counter    = no actor waits on it and no work runs inside it; it is a process address, read by
  `kill -0`
- resolution = held open for the council at the route's close; contracts keep `handle`

## .evidence
- the four extensions and their readers: `.pid` (get, gen, del), `.log` (the daemon's stdio, the
  drive's faults), `.crashes` (the sync's breaker), `.focus` (the tick, `get`)
- invariant: one handle per clone; the `.pid` claim is an exclusive create, so a race elects one
  daemon
