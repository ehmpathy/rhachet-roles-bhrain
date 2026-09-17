# domain.term: route.guard.concurrency

term.chosen   = concurrency
term.kind     = noun
term.boundary = route.guard   # the review ladder of a guarded stone
term.synonyms.forbidden:
- parallelism
- parallel
- bottleneck
- throughput
- fanout

## .what

a **route.guard.concurrency** is the count of peer reviewers that may be **in flight at once**
within one `concurrency group`. it is a **cardinal — a quantity of simultaneous runs**, never a
position and never a duration.

- declared as `concurrency: N` on a group, in a `*.guard` file
- a group with `concurrency: 10` may hold ten reviewers in flight; the eleventh waits for a slot
- an undeclared group takes the default (fulcrum F2 — the value is open)

## ⚠️ .the three quantities on this ladder are DIFFERENT concepts, and each has its own word

| term | the unit | what a spent one means |
|---|---|---|
| **concurrency** | simultaneous runs, a cardinal | the next reviewer waits for a free slot |
| **budget** | review rounds, a count | `exhausted` — terminal for the unlock ladder |
| **timeout** | milliseconds, a duration | `Exceeded timeout` — a defect, or a hang |

⇒ **all three are "an allowance", and no two are interchangeable.** to name any of them by another's
word collapses a distinction the ladder acts on — the ABSENT DISTINCTION
`rule.forbid.domain-term-ambiguity` names.

## 🔴 .why `parallel` and `parallelism` are FORBIDDEN, not merely disfavored

`parallel` is **already taken in this repo, for a different concept** — it names *reviewers that sit
at the same level*, which is a fact about **position on the ladder**, not about **simultaneity**:

- `blackbox/…peer-budget-parallel-l1…` — a test fixture whose `parallel` means *same level*

⇒ two l1 reviewers are `parallel` in that sense whether they run one at a time or ten at a time. so
to reuse the word for simultaneity is a straight overload on a surface that already carries it.

⚠️ **and the wish itself speaks `parallelism`** — *"peer review parallelism"* names this behavior's
own branch. that is the word's **etymology**, and it is not the word's **contract**. a wish speaks
loosely by design; a declared key may not.

## .refs

the term is composed into a declared domain object and a declared `*.guard` key:

- `src/domain.objects/Driver/RouteStoneGuard.ts` — `RouteStoneGuardReviewGroup.concurrency`, the
  declared field the key parses into
- `src/domain.operations/route/guard/parseStoneGuard.ts` — where the key is read, and refused at
  parse when it is not a positive integer
- `src/domain.operations/route/guard/review/runStoneGuardReviews.ts` — where the parsed value binds,
  as one `genBottleneck({ concurrency })` per declared group

```yaml
reviews:
  groups:
    anthropic:
      concurrency: 10
```

⚠️ **this cluster carried the settlement AHEAD of the build, on purpose** — it was written at the
`1.vision` stone of `v2026_09_03.feat-peer-review-parallelism`, when the key did not yet exist,
because the argument that chose the word decays with the round while the key does not. the refs above
are what it now composes. see `.reason` for what the word beat.

## .reason

see the ref-level cluster beside this choice:

- `term=route.guard.concurrency._.choice.reason.md` — the etymology, why `parallel` was
  disqualified by an extant use rather than by taste, and the open fulcrum this word still sits on
