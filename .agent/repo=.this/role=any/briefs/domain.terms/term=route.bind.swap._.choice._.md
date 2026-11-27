# domain.term: route.bind.swap

term.chosen   = swap
term.kind     = verb
term.boundary = route.bind   # "swap, of what?" → of a branch's bind
term.synonyms.forbidden:
- rebind
- switch
- move
- transfer

## .what

to **swap** a bind is to move a branch's bind from one route to another in one act: delete the
bind the branch holds, then set the bind to the new route, under one lock keyed on the branch.

a swap is how education moves the branch between a pursuit and its course: `course init`
swaps the bind from the pursuit to the course; `course exit` swaps it back.

## .refs

- src/domain.operations/education/setRouteBindSwap.ts
- src/domain.operations/education/getOneRouteBindSwapCache.ts

## .reason

- `term=route.bind.swap._.choice.reason.md`
