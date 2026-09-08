# domain.term: latest

term.chosen   = latest
term.kind     = adj                  # noun | verb | adj — reused across objects & operations
term.boundary = review
term.synonyms.forbidden:
- newest
- most-recent
- head
- current          # 🔴 NOT a synonym — it names a different concept. see `.what`

## .what

**of one reviewer's words, the one that supersedes the rest.**

> **must be the LATEST always.** — the wisher, 2026-09-05

🔴 **`latest` is a property of the REVIEWER, never of the hash.** a verdict is superseded by that
reviewer's next word, and by no other event. an edit to the artifact under review moves the hash; it
does not make a reviewer speak, so it cannot retire what the reviewer already said.

⇒ so every operation that picks the latest keys by **slug**, never by hash and never by review index:

| key | why it is wrong |
|---|---|
| **hash** | the driver moves it at will. a debt keyed to it is discharged by an edit — the exact exit `0.wish.md` exists to shut |
| **index** (`rN`) | a position in the guard's declaration order, so it can be reused by a different reviewer when that order changes |
| ✅ **slug** | the reviewer's own identity, stable across every hash and every reorder |

## ⚠️ `latest` and `current` are two concepts, not two words for one

they are near enough to swap by accident, and the swap is the defect this repo paid for twice:

| word | what it qualifies | the question it answers |
|---|---|---|
| **latest** | a **review** | *which word of this reviewer's is live?* |
| **current** | a **hash** | *which artifact content is under review right now?* |

⇒ `hashCurrent` is correct and stays. what is forbidden is `current` as a qualifier on a **review** —
it reads as a synonym for `latest` and silently re-keys the pick to the hash.

🔴 **the two were conflated in the shipped judge, and it failed in both directions at once**: with
every reviewer exhausted the tally read EMPTY (a false block), and with one exhausted it
UNDERCOUNTED (a false pass, which discharged a verdict nobody had addressed).

## 🔴 a pick over `latest` must be a MAX over a TOTAL order

the enumerators return raw `globby` output and no caller sorts it, so any pick that leans on array
order is filesystem-dependent — right on one machine, wrong on another
(`rule.forbid.order-dependence`). iteration ALONE is a partial order: two files tied on iteration
leave a strict `>` with whichever arrived first. **the path breaks every tie**, because two files
cannot share one.

⇒ and the OUTPUT is sorted by slug, a second and separate guarantee: a max makes the *winner*
order-free, and leaves the *sequence* at glob order.

## .refs

- `src/domain.operations/route/guard/review/peer/getLatestPeerGivensPerSlug.ts`
- `src/domain.operations/route/guard/review/peer/getLatestReviewFilesPerSlug.ts`
- `src/domain.operations/route/guard/review/peer/getLatestReviewArtifactForSlug.ts`
- `src/domain.operations/route/guard/review/peer/meter/getAllReviewPeerMeterStatuses.ts`
- `src/domain.operations/route/guard/review/peer/getLatestReviewFilesPerIndex.ts` — ⚠️ the one
  index-keyed survivor; it dedupes *within* a single hash and never crosses one

## .reason

see the ref-level cluster beside this choice:
- `term=route.guard.review.latest._.choice.reason.md` — etymology, the `current` dispute, evidence
