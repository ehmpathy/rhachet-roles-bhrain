# domain.term: unattributed

term.chosen   = unattributed
term.kind     = adj
term.boundary = review.grade.attribution   # a position of the attribution family of `grade`
term.synonyms.forbidden:
- defective    # the grade claims no defect was found
- broken
- partial

## .what

a prompt's census is **unattributed** when its residual is too large to vouch for: past a tenth
of the prompt, it may hide an input that entered with no row of its own. the census does not
claim a defect — it declines to stand behind its rows, and says so.

it is the attribution family's **absence nil**: the family has no fact nil, since a census that
can vouch has naught to report as zero.

## .refs

- `src/domain.operations/review/getOneAttributionGrade.ts`  # the threshold, and why `unattributed` is not a defect
- `src/domain.operations/review/asAttributionGrade.ts`      # an unknown value reads as null, never as `attributed`
- `term=review.attribution._.choice._.md` — the family

## .reason

- `term=review.grade.attribution.unattributed._.choice.reason.md`
