# domain.term.choice.reason: inventory (transcript.token)

## .etymology
the wish names its second outcome *inventory* — what the tokens were spent ON, per category, each
as a share of the whole. a stock-take: every item on the shelf counted into a bin, the bins summed.

chosen over `breakdown` (names the act of a split, not the result held) and `composition` /
`makeup` (read as the ratio alone; the row carries the count, the share, and the tiers).

## .disputes
### dispute: overload with `itemization.inventory` — raised 2026-10-21 — status: RESOLVED (qualify by boundary)
- raised.by  = self review `has-consistent-conventions`, stone 5.1
- claim      = `inventory` is already a declared term: an itemization's exhaustive enumeration
               **by reference only**. a token inventory carries a quantity per row — by that
               glossary's own line, the row-with-a-value shape sits nearer `catalog`. so one word
               would name two concepts
- counter    = the shared core is real: both are exhaustive, both account for every member, and
               both make absence visible — here through the `unattributed` row, which exists so
               no token escapes the census. the senses part by BOUNDARY (an itemization of files
               vs a census of tokens), not by a concept that lacks a word. and the word is the
               wish's own
- resolution = keep `inventory`, qualified as `transcript.token.inventory`. the pair
               `itemization.inventory` / `transcript.token.inventory` is a boundary-qualified
               pair, which `rule.forbid.domain-term-ambiguity` names a false positive. contracts
               in this subsystem say `inventory`; the boundary is carried by the module path
               (`reflect/tokens/`) and the domain object name (`TokenSpendInventoryRow`)

### dispute: `breakdown` in the review subsystem — raised 2026-10-22 — status: OPEN (fulcrum F11)
- raised.by  = peer review repo-rules, stone 5.1, i002 nitpick.2
- claim      = `breakdown` is forbidden here, and `genTokenBreakdownReport` /
               `genTokenBreakdownMarkdown` / `TokenBreakdownEntry` keep it in contracts this diff
               touched
- counter    = the review split is a byte ESTIMATE of one prompt not yet sent, by directory; this
               term is what a transcript's context HELD across metered calls. the forbid binds
               within `transcript.token`, and a rename to `inventory` in `review` would overload
               this word with a second concept
- resolution = awaits the fulcrum council; contracts keep their names meanwhile

## .evidence
- the wish: its outcome list names *inventory* as the per-category spend
- invariant: Σ rows = the context at the last call; `unattributed` absorbs what no tier could place
- the rows sum to 100% in every acceptance snapshot of `reflect.on.token.spend`
