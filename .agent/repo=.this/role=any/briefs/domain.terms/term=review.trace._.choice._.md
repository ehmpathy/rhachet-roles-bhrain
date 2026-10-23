# domain.term: trace

term.chosen   = trace
term.kind     = noun
term.boundary = review
term.synonyms.forbidden:
- history
- timeline
- series
- breakdown   # already the by-input `observe` census's word; one word over two intents
- drilldown

## .what

a report that differences consecutive rounds, so a reader can see whether a change moved a
figure. it is the third position on the `intent` axis, beside `observe` and `defend`:

| intent | the question it answers |
|---|---|
| `observe` | "what is the figure?" |
| `defend` | "can i trust the figure?" |
| **`trace`** | "did a change move the figure?" |

the three are not degrees of detail. `observe` reports a marginal, `defend` reports the
measurement's honesty, `trace` reports a step between two rounds — and a marginal cannot
express a step, because it averages the rounds it sums.

on the cli it is `--trace`, which adds the round × reviewer cross-tab at `tree` breadth.

## .refs

- `src/contract/cli/review._.cost.ts` — the `--trace` flag and its help prose
- `src/domain.operations/review/meter/genReviewMeterStdout.ts` — the cross-tab render
- `.behavior/v2026_09_20.review-cost-meter/1.vision.experience.dimensions.md` — the `intent` axis
- `.behavior/v2026_09_20.review-cost-meter/1.vision.experience.case=6.a-driver-prices-the-review-round-they-just-drove.md` — the demo at this position

## .reason

- `term=review.trace._.choice.reason.md`
