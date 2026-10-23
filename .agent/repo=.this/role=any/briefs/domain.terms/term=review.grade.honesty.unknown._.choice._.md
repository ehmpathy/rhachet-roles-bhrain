# domain.term: unknown

term.chosen   = unknown
term.kind     = adj
term.boundary = review.grade.honesty   # a position of the honesty family of `grade`
term.synonyms.forbidden:
- unmetered   # true of `refused` too; it cannot part the two nils
- zero
- n/a

## .what

a run is **unknown** when it carries no metrics but the brain may have been reached: its prompt
was compiled, its metrics were compiled, or the brain's answer was written. the run then died or timed out before it wrote
metrics, so its spend is **unrecorded** — it may well have been billed.

it is the honesty family's **absence nil**: it renders absent, never `$0`, and every sum
excludes it with the count of what it excluded stated beside the total.

## .scope — one sense of a word with others

this cluster names the honesty position alone. where the same word is a value of another closed
set, it names that instrument's own absence, read under its own type.

## .refs

- `src/domain.operations/review/meter/getOneReviewRunGrade.ts`   # the three witnesses that set it
- `src/domain.operations/review/meter/genReviewMeterStdout.ts`   # why the word must stay `unknown`
- `term=review.grade.honesty._.choice._.md` — the family

## .reason

- `term=review.grade.honesty.unknown._.choice.reason.md`
