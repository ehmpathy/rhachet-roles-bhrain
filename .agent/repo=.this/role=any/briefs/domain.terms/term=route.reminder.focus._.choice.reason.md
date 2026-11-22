# domain.term.choice.reason: focus

## .etymology
`focus` = the point attention rests on. a driver clone attends to one route at a time, even with a
stack of routes bound; the reminder's attention follows it. the word names WHAT the pointer is
(where the clone's attention rests), not HOW it is stored (a file) nor which mechanism reads it.

rejected:
- `target` — overloaded here: a review has targets (`review.scope.target`), so a second sense
  would collide
- `current route` / `active route` — `active` already names a drive's liveness
  (`getRouteReminderDriveActivity` → `active: true|false`); a focus route can be inactive (a
  halted focus is how `get` names why the reminder is down), so `active route` would misread
- `bind` — the branch bind is a different record (`route.bind`); the focus is written by the drive,
  not by `route.bind.set`, and the two can briefly differ (vision fulcrum F2)

## .disputes
none.

## .evidence
- scenario timeline (vision `1.vision.yield.md`, `case=1`): a clone drives route A, then route B;
  the second drive moves the focus to B; the one daemon's next tick nudges about B. the noun that
  moves is the focus; no daemon comes or goes
- attributes: one per clone · absolute route path · written only on change · kept after a reap, so
  `get` can name the halted route
- invariants: one focus per clone · a daemon with no focus exits at its first tick (route-not-live) ·
  a reap or an exit on behalf of a route happens only while the focus still names that route
  (`isRouteReminderFocusOn`)
