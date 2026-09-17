# domain.term: route.guard.level.pour

term.chosen   = pour
term.kind     = verb   # the ACT to release a level's reviewers; nominalizes to "a pour"
term.boundary = route.guard.level   # the level whose reviewers it releases
term.synonyms.forbidden:
- release
- fanout
- dispatch
- kickoff

## .what

a **level pour** is the **act to release a level's reviewers into concurrent execution** — the
moment the ladder opens a level and lets its members run, bounded by the level's declared
concurrency.

it is a single act over the level's whole roster: announce the pour, then run the members through
`Promise.allSettled`, no more than the bound in flight at once.

```ts
// asReviewLevelPourAnnounce, before any lane launches:
"🦉 l1 pours 4 lanes · ≤2 at a time"
```

## ⚠️ .pour is the ACT; wave is the STATE — they are two terms, never one

the pour launches; the **wave** (`route.guard.level.wave`) is the ordered-release buffer that then
holds each settled block until every earlier-declared slot has landed. one opens the level, the
other orders how its results come down.

| term | grain | answers |
|---|---|---|
| **pour** | one act, once per level | *release this level's reviewers, at most N at a time* |
| **wave** | live state, through the level | *which have settled, and may this block be shown yet?* |

⇒ **a reviewer at i015 asked whether these name one concept from two angles.** they do not: a pour
with no wave would launch and never order the settle; a wave with no pour would order blocks that
never began. the pour is the verb that opens; the wave is the noun that tracks the settle.

## 🟡 .`launch` is a wave STEP, not a synonym of pour

the wave buffer carries a `launch(index)` method that marks **one lane** inflight. that is a
sub-step within a pour, at a finer grain — the pour releases the roster, `launch` records that a
single member entered flight. so `launch` is neither forbidden nor equivalent; it names a different
grain of the same event.

## .refs

where the term composes declared operations:

- src/domain.operations/route/guard/review/asReviewLevelPourAnnounce.ts   # composes the pour announce line
- src/domain.operations/route/guard/review/getOneReviewLevelPourBound.ts  # the concurrency bound the pour runs under
- src/domain.operations/route/guard/review/runStoneGuardReviews.ts        # `toPour`, and the `Promise.allSettled` that pours it

## .reason

see the ref-level cluster beside this choice:

- `term=route.guard.level.pour._.choice.reason.md` — why `pour` over `release`, `fanout`, and
  `dispatch`, and why the bottleneck metaphor makes it the apt verb
