# domain.term: taken

term.chosen   = taken
term.kind     = noun                 # noun | verb | adj — reused across objects & operations
term.boundary = review
term.synonyms.forbidden:
- response
- reply
- answer
- rebuttal
- contemplation   # `contemplate` is the VERB that records a taken — never the artifact itself

## .what

**what a driver hands back: its written answer to one reviewer's critique.**

the half of the review conversation the **driver** authors, and the counterpart of the `given`. one
taken pairs one given, and it is what discharges the contemplation the gate holds passage on.

its path is **derived from the given's path** — `getRouteGuardReviewPeerPathTaken.ts:33-34` swaps
one infix and retains *"every other segment verbatim"*:

```
… ._.given.by_peer.$slug.md      →      … ._.taken.by_self.$slug.md
```

🔴 **so a taken always lands at its GIVEN's hash, never at the current one.** the driver does not
choose where it goes; the critique it answers decides.

each open point in a taken carries one of two shapes (`rule.always.converge-with-reviewers.via-a-taken-per-point`):

| shape | the claim | must carry |
|---|---|---|
| `[REPAIR]` | *"i fixed it"* | a quote of the **current** file |
| `[REFUTE]` | *"it does not hold"* | cited evidence — out of scope, a false positive, a deliberate tradeoff |

⚠️ **a taken's existence is what the gate checks, never its content** (`setStoneAsContemplated.ts:77`).
an empty one passes the engine and fails the reviewer, which re-raises the point next round.

## .refs

- `src/domain.operations/route/guard/review/peer/getRouteGuardReviewPeerPathTaken.ts`
- `src/domain.operations/route/guard/review/peer/getAllRouteGuardReviewPeerTakenMetas.ts`
- `src/domain.operations/route/guard/review/peer/getRouteGuardReviewPeerContemplationStatus.ts`
- `src/domain.operations/route/stones/setStoneAsContemplated.ts`

## .reason

see the ref-level cluster beside this choice:
- `term=route.guard.review.taken._.choice.reason.md` — etymology, the give/take pair, evidence
