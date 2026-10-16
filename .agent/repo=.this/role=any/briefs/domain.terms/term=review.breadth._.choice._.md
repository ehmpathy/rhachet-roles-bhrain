# domain.term: breadth

term.chosen   = breadth
term.kind     = noun
term.boundary = review
term.synonyms.forbidden:
- scale
- level   # for report coverage only; `route.guard.level` owns the word for a peer-review ladder rung
- granularity
- depth

## .what

**how much of the corpus one review-cost report covers.** a closed set of three positions,
ordered from narrowest to widest:

| position | what one report covers |
|---|---|
| `run` | one `rhx review` invocation |
| `tree` | every run under one git worktree |
| `grove` | every run under every tree on this machine |

it is the axis `--of` selects a position on — `rhx review._.cost --of run|tree|grove` — so the
word names the axis and the three words name its positions.

## .refs

- `src/contract/cli/review._.cost.ts` — the `BREADTHS` const and the `Breadth` type
- `src/domain.operations/review/meter/getOneReviewRunMeterLatest.ts` — the `run` position
- `src/domain.operations/review/meter/getAllReviewRunMeters.ts` — the `tree` position
- `src/domain.operations/review/grove/genReviewGroveReport.ts` — the `grove` position
- `.behavior/v2026_09_20.review-cost-meter/1.vision.experience.dimensions.md` — the axis, declared

## .reason

- `term=review.breadth._.choice.reason.md`
