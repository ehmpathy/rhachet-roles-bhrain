# fulcrum F5 — `debt` stays prose; `uncontemplated` stays canonical

- **rework** = clean
- **status** = ✅ **answered — Q3, closed by `rule.forbid.domain-term-synonyms`' own prose carve-out.**
  ⚠️ the summary's main table read `open` for this row until 2026-09-08 while its own wisher-asks
  table read `answered`; **the two disagreed inside one file**
- **confidence** = 95%
- **found** = 1.vision

## .the fork, stated fairly

the wish uses "debt" throughout, and it is the clearest short word for the concept. so:

- **adopt it** — make `debt` a domain term, with a cluster in `domain.terms/`.
- **prose only** — use it as a metaphor in these documents; keep `uncontemplated` as the sole
  contract word.

## .taken, and why at the time

**prose only.** the engine already names this concept `uncontemplated`, in an operation, a
`PassageReport.blocker` value, and a rendered prompt. a second word for one concept in a contract
is what `rule.forbid.domain-term-synonyms` forbids outright, and the published `blocker`
value is an external interface — the most expensive place to drift.

the metaphor is allowed and useful: the rule permits a synonym in a comment, to describe the
concept from an alternate perspective. so `debt` may appear in a narrative and must not appear in
an operation name, a field, or a flag.

⚠️ the metaphor is also inexact, which is a second reason to keep it out of contracts: a debt is
settled by payment alone, while this settles three ways — the driver answers, the reviewer
withdraws, or a human forgives. `1.vision.yield.md` records "an open question in a thread" as the
truer analogy.

## .rework, and why

**clean.** it is a word in prose. to adopt it later means a `domain.terms` cluster and a rename
sweep; to keep it out costs a search-and-replace in these documents.

## .confidence — 95%

the 5% doubt: a reviewer may read the metaphor's presence in the yield as drift, even though the
rule scopes the forbid to contracts. the explicit callout in `1.vision.yield.md` § "their words vs
ours" exists to preempt that read.

## .where

- `1.vision.yield.md` § "mental model / their words vs ours"
- every `1.vision.experience.case=N.*.md` — `debt` appears in narrative and commentary alone

## .the verdict

_unruled._
