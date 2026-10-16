# domain.term: honesty

term.chosen   = honesty
term.kind     = noun
term.boundary = review.grade   # one family of `grade`: how much of a run's spend is proven
term.synonyms.forbidden:
- accuracy     # a property of a figure against truth; honesty is whether a figure was measured at all
- certainty    # a degree; honesty is a closed set of three positions, never a scale
- confidence   # already forbidden for the genus `grade`
- coverage     # the census's share of the corpus — the count beside a sum — never one run's grade

## .what

**honesty** is the grade family the `meter` emits per run. it answers *"is this run's cost a
measurement, a known nil, or an absence?"* — and it is the family the meter is named for: the
difference between "naught was spent" and "we did not record it" is the whole honesty of a meter.

its positions are a closed set:

| position | the run | its cost renders |
|---|---|---|
| `metered` | `metrics.realized.json` present | the measured figure |
| `refused` | no metrics, no prompt, no compiled metrics, no answer — stopped before the brain | `$0`, a fact |
| `unknown` | no metrics, but the brain may have been reached | absent, excluded from every sum |

each position has its own cluster: `term=review.grade.honesty.metered`, `.refused`, `.unknown`.

## .refs

- `src/domain.operations/review/meter/getOneReviewRunMeter.ts`  # `ReviewRunGrade` — the union
- `src/domain.operations/review/meter/getOneReviewRunGrade.ts`  # parts `refused` from `unknown`
- `src/domain.operations/review/meter/getOneAccountedCost.ts`   # the absent/zero law over a set
- `src/domain.operations/review/getOneGradeCensus.ts`           # the count beside a sum
- `term=review.grade._.choice._.md` — the genus

## .reason

- `term=review.grade.honesty._.choice.reason.md`
