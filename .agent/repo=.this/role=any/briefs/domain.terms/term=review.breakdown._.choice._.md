# domain.term: breakdown

term.chosen   = breakdown
term.kind     = noun
term.boundary = review   # the per-file token count of one set of a review's inputs
term.synonyms.forbidden:
- split   # already `review.scope.split`, the partition of a run's targets
- locus   # already `review.scope.locus`, the place a mass sits; a breakdown is the division by file, never the address

## .what

a breakdown is the per-file token count of one set of review inputs — the table
`tokens.expected.md` renders, and the record behind the by-input `observe` census. it answers
*"how many tokens does each file of this input carry?"*, one row per file, plus a total.

one breakdown per set: `all`, `rules`, `targets`, and one per named target input (`byInput`).

## .refs

- `src/domain.operations/review/genTokenBreakdownReport.ts`          # `TokenBreakdownEntry` — one row
- `src/domain.operations/review/asTokenBreakdownsByTargetInput.ts`   # one breakdown per named target input
- `src/domain.operations/review/genTokenBreakdownMarkdown.ts`        # the `tokens.expected.md` render
- `src/domain.operations/review/setTokenArtifacts.ts`                # the `Breakdown` type

## .reason

- `term=review.breakdown._.choice.reason.md`
