# domain.term: attributed

term.chosen   = attributed
term.kind     = adj
term.boundary = review.grade.attribution   # a position of the attribution family of `grade`
term.synonyms.forbidden:
- whole
- complete
- clean

## .what

a prompt's census is **attributed** when its residual — the chars no named input claims — is
small enough to be render overhead (tags, headers). its rows can then be trusted to say what
bought the prompt. its pair is `unattributed`.

## .refs

- `src/domain.operations/review/getOneAttributionGrade.ts`  # `AttributionGrade`, and the threshold that sets it
- `src/domain.operations/review/asAttributionGrade.ts`      # reads a grade back off disk
- `term=review.attribution._.choice._.md` — the family

## .reason

- `term=review.grade.attribution.attributed._.choice.reason.md`
