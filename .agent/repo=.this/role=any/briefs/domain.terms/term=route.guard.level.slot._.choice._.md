# domain.term: route.guard.level.slot

term.chosen   = slot
term.kind     = noun
term.boundary = route.guard.level   # the level whose roster this coordinate indexes
term.synonyms.forbidden:
- position
- seat
- lane
- ordinal
- offset

## .what

a **guard.level.slot** is a **reviewer's declared coordinate within its own level**, plus that
level's size: `{ index, total }`.

it is assigned from the reviewer's position in the guard's declared peer list, **before** the level
sort and **before** any subprocess is spawned. so it is stable against the order in which lanes
actually settle, which under a concurrent pour is a race.

```ts
reviewer: {
  index: 3, slug: 'has-clamped-behavior', level: 1, budget: 5, rounds: 1,
  slot: { index: 2, total: 4 },     // the 3rd of 4 reviewers AT LEVEL 1
}
```

## ⚠️ .a slot is within ONE LEVEL. `ContextGuardProgress` is across the WHOLE GUARD

two coordinates, two scopes, and they are easy to conflate because both are "where this step sits":

| carrier | scope | what it is for |
|---|---|---|
| **slot** | one **level**'s roster | the emit path releases settled blocks in declared order, and the tail status reports how many are LEFT |
| `ContextGuardProgress` | the whole guard — reviews **and** judges | the tree's branch character (`├─` vs `└─`) |

⇒ **so they are two terms, never one overloaded one.** the practical reason they cannot merge:
`setStoneAsPassed` wraps `cliEmit` and supplies the guard-wide position itself, which overwrites any
second argument — so a roster handed there never arrives. **the slot rides the event; the guard-wide
position rides the argument.**

## ⚠️ .a slot is a COORDINATE, and `total` is a CARDINAL — the same hazard `level` carries

`slot.index` is an ordinal (a position, zero-based) and `slot.total` is a cardinal (a count). they
sit in one object and a reader may relate them wrongly.

⇒ the bound that keeps it honest is stated on the render: **`done + left = slot.total`** at every
tick, where `left` is inflight + queued. a peer review read `left` as queued-alone and computed
`0 left` where `1 left` was right — the two senses coincide on an unbounded level and diverge under
a cap, which is exactly the level this feature exists to make possible.

## .why `slot?` is optional, and what its absence MEANS

absence is a first-class state, never a legacy shape:

> **a caller that supplies no slot has handed no roster, so no order can be imposed.**

such an event falls through to the un-buffered emit path the renderer had before concurrency —
header sealed at inflight, detail at finish. that is correct for a single-lane caller, and it is
what keeps `GuardProgressEvent` a shape an external sdk consumer can still legally send.

## .refs

where the term composes declared objects and operations:
- src/domain.objects/Driver/GuardProgressEvent.ts                      # `slot?` on the reviewer — sdk-exported
- src/domain.operations/route/guard/genContextCliEmit.ts               # the ordered release buffer reads it
- src/domain.operations/route/guard/review/runStoneGuardReviews.ts     # `levelSlotByIndex`, rebuilt per level
- src/contract/sdk/route.ts                                            # re-exports the type that carries it

## .reason

see the ref-level cluster beside this choice:
- `term=route.guard.level.slot._.choice.reason.md` — why `slot` over `position`, `seat`, and `lane`,
  and why the roster rides the event rather than the argument
