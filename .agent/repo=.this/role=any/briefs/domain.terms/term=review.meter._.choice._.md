# domain.term: meter

term.chosen   = meter
term.kind     = noun
term.boundary = review        # the instrument that reads a review run's spend
term.synonyms.forbidden:
- tracker
- monitor
- accountant
- gauge

## .what

a meter is the instrument that reads a review run's spend off the log corpus. it is the
reader, never the quantity — the quantity is `review.cost`.

the pair is instrument vs quantity, and it is the whole reason both words exist. a
`ReviewRunMeter` is one row the instrument produced; the `cost` field on it is the money. to
collapse the two leaves no word for a run the instrument read and could not price — which is
exactly the `unknown` grade, and the central claim of this whole surface.

so a meter always renders a grade beside its figure:

| the meter did | the grade | the cost renders |
|---|---|---|
| read the run, and priced it | `metered` | the figure |
| read the run; the brain charged naught | `refused` | `$0` — a fact |
| read the run, and could not price it | `unknown` | absent, never `$0.00` |
| could not read the run at all | `unknown`, with a `defect` | absent, and it names the dir |

a meter measures; it never estimates. an instrument that fell back to a rate card, a
declared glob, or a projection is not a meter — it is a forecast under a meter's name, and the
figure it prints reads as measured. the surface that did that was deleted rather than repaired
(`F3`).

`meter` names no breadth. the instrument is the same at every position of the `--of`
axis; what changes is the corpus it reads. a name that baked a breadth into the instrument was
the defect `F1` struck.

## .refs

- src/domain.operations/review/meter/getOneReviewRunMeter.ts       # `ReviewRunMeter`, one row
- src/domain.operations/review/meter/getAllReviewRunMeters.ts      # every run under a tree
- src/domain.operations/review/meter/getOneReviewRunMeterLatest.ts # the run that just ran
- src/domain.operations/review/meter/genReviewMeterReport.ts       # `ReviewMeterBucket`
- src/domain.operations/review/meter/asReviewRunMeterOfDefect.ts   # the row for a run it could not read

## .reason

- `term=review.meter._.choice.reason.md`
