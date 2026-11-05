# F18 — the route guard's EPIPE crash is deferred for dirt, not fixed at 5.3

## .the fork

a piped `route.stone.set --as passed | head` crashed in `genContextCliEmit` with an unhandled
`EPIPE`. the same defect is already fixed for `reflect.on.token.spend` by a file-local
`withQuietClosedPipe`.

- **A — fix now**: lift `withQuietClosedPipe` to `src/infra/cli/`, call it at the route cli entry,
  add an acceptance clamp
- **B — defer**: catch a dream with the shape of the fix

## .taken — B, and why at the time

the fix is safe, but it is not clean: the route guard emitter and the route cli entry sit outside
this route's diff, and the lift changes where a function lives for a second consumer this stone
never opened. the defect is cosmetic to a human (a crash only after the reader has stopped
reading), with no shipped data loss.

## .rework — clean

one function moved, one call added at the route cli entry, one acceptance case.

## .confidence — 75%, and why it is low

the lift is small, and a reviewer may hold that a defect met mid-round in a sibling cli is
scouts-honor work, not dirt.

## .where

- `.dream/v2026_10_22.fix.route-guard-emit-crashes-on-a-closed-pipe.md`
- `src/domain.operations/route/guard/genContextCliEmit.ts`
- `src/contract/cli/reflect.on.token.spend.ts` — the extant `withQuietClosedPipe`

## .verdict

open — for the council.
