# domain.term: meter

term.chosen   = meter
term.kind     = noun
term.boundary = route.guard.review.peer
term.synonyms.forbidden:
- lane
- counter
- tally
- usage
- ledger

## .what
a **meter** is one reviewer's spend record on one stone — the shape `{ slug, level, rounds,
budget }`, plus the display fields a tree render reads.

it answers two questions and no others: **how many rounds has this reviewer spent, and how many was
it given?** every claim the ladder makes about capacity — dry, exhausted, live — is a read of a
meter.

🔴 **a meter records a SPEND; it renders no verdict.** `verdict: 'exhausted'` asks whether the
reviewer was skipped for budget this generation; `rounds >= budget` asks whether it has a round
left. the two diverge for a reviewer at 8/8 that just ran, and the gate needs the second. ⇒ a reader
who takes the meter for the verdict gets the wrong answer in exactly the cell the budget gate exists
to serve.

🟡 **it is one reviewer × one stone, never a set.** the plural is the ledger —
`$route/.route/reviewPeerMeters.jsonl`, append-only and last-entry-wins per `(stone, slug)`.

## .refs
where the term composes declared objects & operations:
- src/domain.objects/Driver/RouteStoneGuardReviewPeerMeter.ts
- src/domain.operations/route/guard/review/peer/meter/                  # the operation namespace
- src/domain.operations/route/guard/review/peer/meter/getCurrentPeerMeters.ts,
  getCurrentPeerMetersForStones.ts, getAllRouteStoneGuardReviewPeerMeters.ts
- src/domain.operations/route/guard/review/peer/meter/computeBudgetGrantRefusal.ts  # `BudgetGrantMeter`
- src/domain.operations/route/guard/tree/formatGuardTree.ts             # `GuardPeerMeterStatus`

## .reason
see the ref-level cluster beside this choice:
- `term=route.guard.review.peer.meter._.choice.reason.md` — etymology, why not `lane`/`counter`, and
  the meter-vs-verdict line
