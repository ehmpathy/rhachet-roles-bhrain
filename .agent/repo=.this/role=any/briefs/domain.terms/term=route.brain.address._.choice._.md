# domain.term: route.brain.address

term.chosen   = address
term.kind     = noun
term.boundary = route.brain   # the value a brain dispatch reads to name its target clone
term.synonyms.forbidden:
- id
- identifier
- handle

## .what

a **route.brain.address** is the string a brain-dispatch reads to name the live driver clone it
targets — `rhx clone say @:<address>`. it is derived from `rhx clone whoami`'s raw payload: the
clone's `slug` when set, its `serial` otherwise.

- `asCloneAddress` picks `slug` first, `serial` as fallback — both non-empty after trim, or `null`
- `getCloneAddress` is the communicator that spawns `clone whoami`, parses its json, and returns
  either an address or a halt cause (`route.brain.halt.cause`)

## .refs

- src/domain.operations/route/brain/asCloneAddress.ts
- src/domain.operations/route/brain/getCloneAddress.ts

## .reason

see the ref-level cluster beside this choice:

- `term=route.brain.address._.choice.reason.md` — why `address` over `id`/`identifier`/`handle`
