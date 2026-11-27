# domain.term.reason: route.bind.swap

## .etymology

a swap trades one item for another in place. the branch holds exactly one bind; a swap trades
the route it names for another, and the branch is never left bound to two.

rejected:
- `rebind` — reads as a repeat of the same bind, not a trade for another route
- `switch` — the git verb for a branch change; here the branch stays, only its route changes
- `move` — names a relocation of files; no route dir moves
- `transfer` — names a hand-off between owners; one branch owns the bind throughout

## .evidence

- `route.bind` holds one flag per branch (`asRouteBindFlagName`); `setRouteBind` refuses a second
  route while one is bound, so a change of route needs a delete then a set
- two callers need the same delete-then-set (`course init`, `course exit`), so it earned a name
- a swap names the act from the branch's view, which is the bind's owner

## .invariants

- after a swap, the branch is bound to exactly the new route
- a swap runs under one `withSimpleMutex` hold keyed on the branch, so two swaps never interleave
- a `route.drive` in the gap between the delete and the set sees no bind; a re-run recovers
