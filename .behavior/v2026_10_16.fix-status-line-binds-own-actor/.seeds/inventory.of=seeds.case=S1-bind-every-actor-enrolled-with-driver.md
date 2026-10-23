# S1 · bind every actor enrolled with driver, and only those

## .said

> it should hit, on init, settings.of.repo.json; yeah. but also, if an actor is enrolled with this role, it should init on them too - even if ambient repo does not have it. is that clear?

> only actors who enrolled with driver get the status line

## .settled

- the init writes `settings.of.repo.json`, the one real file of the split layout
- the bind follows the driver role, never the repo: each actor whose enrolled roles include
  `driver` gets the status line in its own `settings.of.repo.json`, whether or not the repo actor
  carries driver
- an actor not enrolled with driver does not get it

## .landed

- `.fulcrums/inventory.of=fulcrums.case=F1-target-is-the-repo-actor-file-not-whoami.md` — ruled
- `.fulcrums/inventory.of=fulcrums.case=F3-every-actor-renders-the-status-line.md` — ruled, reversed
