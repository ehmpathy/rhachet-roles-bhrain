# F119 — review.by's rubrics share no cacheable prefix, so its pour owes no prime

- raised 2026-10-07, by the driver, to answer `repo-rules` blocker.1 at 5.1 i009
- rework: **clean** — were a prime owed, it is one call ahead of the pour in `stepReviewBy`
- status: 🟡 **BEST-GUESSED — dispute it**
- confidence: **85%**

## .the fork, stated fairly

| option | the claim |
|---|---|
| **A — prime before the pour (the reviewer's ask)** | every rubric of one `review.by` call is a review for the same role, so they share the role's prefix from token 0; a cold pour pays it N times |
| **B — no prime (as shipped)** | a review's system prompt is its static head — instructions, output contract, AND the rubric's own rules (`asReviewPrefixPrimeKey`). distinct rubrics carry distinct heads, so their replica pins `sha256(model + \0 + systemPrompt)` differ and each lands on its own replica. a prime warms a replica no peer is routed to |

## .taken, and why

**B.** `rule.require.prime-the-shared-prefix-before-a-pour` asks first *"do N requests share a
prefix?"* — and a cache is only shared where the requests are pinned to one replica. the pin is
derived from the whole system prompt, which ends in rubric-specific rules, so no two rubrics of a
`review.by` call share a pin. the common bytes ahead of the rules (instructions + output contract,
a few KB) are byte-identical, and still unreachable: they sit on different replicas.

where lanes DO share a head — the partitions of one lane — the prime already runs, per head, at
`stepReview` (`genReviewPrefixPrime`, keyed by `asReviewPrefixPrimeKey`). each `review.by` rubric
runs through that same `stepReview`, so a rubric whose head a peer shares would meet that peer and
prime there. the mechanism is not absent from `review.by`; the shared head is.

## .rework, and why

**clean.** a role-level prefix that precedes every rubric would need the role's briefs hoisted
into a pin-stable head shared by all rubrics — a prompt-layout change, out of this stone's scope.
if that layout ever lands, the extant per-head prime covers it with no change to `stepReviewBy`.

## .confidence, and why it is not higher

it rests on the claim that the pin key spans the whole system prompt. a provider that caches by
prefix across replicas (no affinity) would make A pay the few-KB common bytes once; none of the
brains this repo routes to does so today.

## .where

`src/domain.operations/review.by/stepReviewBy.ts` · `src/domain.operations/review/prime/asReviewPrefixPrimeKey.ts` ·
`src/domain.operations/review/stepReview.ts` (the per-head prime)

## .verdict

— (awaits the council)
