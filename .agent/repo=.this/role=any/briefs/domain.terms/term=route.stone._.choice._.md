# domain.term: stone

term.chosen   = stone
term.kind     = noun
term.boundary = route
term.synonyms.forbidden:
- checkpoint
- milestone-marker
- waypoint
- step
- phase

## .what
a **stone** is a single milestone on a **route** — a marker a traveler passes, which records how
far along they are.

a stone **marks progress**; it does not gate it. the gate is the **guard**, an optional validation
the stone may carry. that split is the term's whole character: to conflate them would overload one
word onto two concepts.

## .refs
where the term composes declared objects & operations:
- src/domain.objects/Driver/RouteStone.ts, RouteStoneGuard.ts, RouteStoneDisposition.ts
- src/domain.objects/Driver/RouteStoneDriveArtifacts.ts, RouteStoneGuard*Artifact.ts
- src/domain.operations/route/stones/setStoneAsPassed.ts
- src/domain.roles/driver/skills/route.stone.set.sh, route.stone.get.sh, route.stone.judge.sh

## .reason
see the ref-level cluster beside this choice:
- `term=route.stone._.choice.reason.md` — etymology, the settled `checkpoint` dispute, and the
  stone-vs-guard line
