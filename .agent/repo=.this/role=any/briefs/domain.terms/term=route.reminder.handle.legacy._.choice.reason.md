# domain.term.choice.reason: legacy

## .etymology
`legacy` = left by a prior version. the word names the one property that sets these handles apart:
WHO wrote them (a prior release, at the per-route home), not their state.

rejected:
- `stale` — already names a handle whose pid is dead (`getRouteReminder` reads a stale handle as
  absent). a legacy handle may name a LIVE daemon, which is exactly why the sweep exists
- `orphan` — already names a loose daemon with no handle (`RouteReminderOrphanError`)
- `old` — names age, not origin; a legacy handle written a minute before the upgrade is still legacy

## .disputes
none.

## .evidence
- the defect the wish names: two daemons live on one clone, one per route. after the upgrade the
  per-route daemons are the legacy ones; the sweep reaps them before the first clone spawn
- invariants: the sweep touches only this clone's stem · a reap is a compare-and-delete on the pid it
  read · an expected fault keeps the handle and names the fix
