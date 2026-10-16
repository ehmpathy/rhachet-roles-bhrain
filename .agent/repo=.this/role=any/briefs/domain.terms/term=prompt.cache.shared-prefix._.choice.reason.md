# domain.term.choice.reason: shared prefix

## .etymology

**prefix** is the vendor's own word — anthropic, openai, and openrouter all document the feature
as a *prompt prefix cache*, and all three state the same mechanic: the cache serves a run of
tokens from position 0 and stops at the first byte that differs. so `prefix` was never up for
choice; it is imported, and to rename it would fork us from every doc a reader will consult.

**shared** is the half this repo added, and it carries the whole lesson. the vendor word names
the *mechanism*; `shared` names the **relation** — a prefix is a fact about a PAIR of requests,
never about one prompt alone. that is the distinction the measured defect turned on:

- the review prompt had a magnificent prefix, by any one-prompt read of the word
- it had **0.0%** shared with its own next round, because the pin was absent and the replica
  that held it never saw the second call

"is the prefix good?" is unanswerable. "what do these two share?" has an integer answer, and
the integer is what the meter reports.

## .the rejected peers

| rejected | why |
|---|---|
| `common prefix` | `common` is the synonym-drift twin of `shared`, and `shared` was already in the adapter's own prose (*"the key names what requests SHARE"*). one word per concept |
| `static head` | names a **block a compiler emits**, which is a different concept — and one this repo also has, as `promptHeadStatic`. the head is what we INTEND to share; the shared prefix is what two requests MEASURABLY did. they part the moment a layout defect lands, and that gap is what the meter exists to catch |
| `cacheable prefix` | asserts the outcome the term exists to interrogate. a prefix is cacheable only if it is also pinned; to build that claim into the name hides the third obligation, which is the one that was missed |
| `prompt prefix` | the vendor's full phrase, and it drops `shared` — which is the half that makes the concept a relation rather than a property |
| `preamble` | prose, not a measurement. names a position and carries no claim about what repeats |

## .evidence

- discovery: a cost meter run over `.log/bhrain/review`, 2026-09-18. the corpus reported a
  cache hit rate near zero against a prompt whose repeated block was ~97% of its bytes. the
  contradiction is what forced the word apart into mechanism and relation
- instrument: `getOneSharedPrefixByteCount` / `getOneSharedPrefixOverlap`, which take `{ a, b }` and
  `{ earlier, later }` respectively — both binary by signature, which is the contract made
  checkable
- measured, over the same fixtures, before and after the layout repair:

  | pair | before | after |
  |---|---|---|
  | round 1 → round 2 | 534 bytes, 3.3% | **13,057 bytes, 78.8%** |
  | round 2 → round 3 | 13,255 bytes, 82.7% | **15,288 bytes, 81.9%** |

  each share is over the later prompt's total bytes; `research.review-cost-and-cache` holds the
  full series, the later tail flip included

- invariants:
  - a shared prefix is defined over exactly TWO prompts; a one-prompt figure is a category error
  - it is measured in bytes from position 0, never from a section header
  - `sentAs` records which message slot carried it, because the slot decides whether a replica
    pin could be derived — and an unpinned prefix saves naught, however long
