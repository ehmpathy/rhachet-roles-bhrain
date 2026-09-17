# domain.term.choice.reason: route.guard.level.pour

## .etymology

**pour** follows the wisher's own metaphor for this whole feature — the **bottleneck**. verbatim,
seed S1 of `v2026_09_03.feat-peer-review-parallelism`:

> *"we want it to have a bottleneck ability"*

⇒ a bottleneck controls a **pour**. the neck of a bottle is not a defect; it meters the pour so the
drink does not go down your shirt. so once `concurrency group` named the neck and `concurrency`
named its width, the act the neck governs already had its word: the level **pours** its reviewers,
and the bound is how fast it may pour.

the metaphor is not decoration — it is why the term composes: an unbounded level pours freely, a
`concurrency: 1` level pours one at a time, and both read true in the one word.

## .the enumeration

the word must cover every act-shape the code performs:

| # | the instance |
|---|---|
| i1 | a level of **many** reviewers, released unbounded |
| i2 | a level of many reviewers, released **≤N at a time** |
| i3 | a level of **one** reviewer — a pour of one, announce suppressed |
| i4 | a level where the members were **partitioned first** (cached/exhausted skipped) — only `toPour` is poured |

| candidate | verdict | the row it breaks on |
|---|---|---|
| `release` | **too generic** | names no rate and no roster — a lock releases, a promise releases; the word carries no metaphor for the bound |
| `fanout` | **too narrow** | asserts the unbounded case (i1) and misreads at i2/i3 — a "fanout of 1" is a contradiction, the exact trap `parallelism: 1` fell to |
| `dispatch` | **wrong grain** | dispatch is per-item; the pour is per-**level**, over a roster, under one bound |
| `kickoff` | **informal, no bound** | carries a start but no rate — no part of the word meters i2 |
| ✅ `pour` | **covers all four** | metered by nature; a pour of one and a pour of many are both pours, and the bound is the neck |

## .disputes

none raised. the word fell out of the settled `bottleneck` metaphor rather than from a fork, so no
alternative was argued at the vision. recorded here so a later dispute has a seat.

## .evidence

- discovery: the bottleneck metaphor, settled in seed S1 and carried through `concurrency` and
  `concurrency group`; `pour` is the verb those two nouns implied
- precedent: `asReviewLevelPourAnnounce` and `getOneReviewLevelPourBound` both nominalize it as
  `Pour`, and `runStoneGuardReviews` names the poured set `toPour` — three sites, one sense
- invariants:
  - a pour is **per level**, never per reviewer — the bound is a level's cardinality
  - a **zero**-member level suppresses its announce (`asReviewLevelPourAnnounce` returns null) —
    there is no pour to announce
  - 🔴 a **single**-member level DOES announce. ⚠️ this bullet read *"a single member suppresses
    its announce, because a one-lane pour has no concurrency story to tell"* until 2026-09-16, and
    the code had already moved: a one-lane level seals no header at inflight, and `drawStatus`
    returns at once under a pipe — so with no announce it is **byte-silent from launch to settle**,
    and a reader cannot part *"this level is slow"* from *"this level never began"*. the announce
    serves OBSERVABILITY, never a concurrency story, which is why the one-lane case earns it too.
    ⇒ caught by eight acceptance snapshots that carried the announce while this brief denied it;
    the operation's own `.note` had held the correct reason the whole time
  - the pour releases only `toPour` — the members that survived the cached/exhausted partition — so
    a skip never takes a slot in the pour
