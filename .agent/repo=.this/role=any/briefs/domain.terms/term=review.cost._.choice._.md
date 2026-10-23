# domain.term: cost

term.chosen   = cost
term.kind     = noun
term.boundary = review        # money already spent on review runs
term.synonyms.forbidden:
- budget   # for money spent only; `route.guard.budget` owns the word for the round allowance
- spend
- ledger
- bill

## .what

**cost** is money already spent on review runs — read from `metrics.realized.json`, never
estimated and never applied from a rate card.

cost is REALIZED, never ALLOWED. it reports what was charged; it constrains naught. the
allowance concept is `route.guard.budget`, which owns the round allowance — a different
resource at a different layer.

every cost figure carries an honesty grade, because an unrecorded cost must not read as a nil
one:

| grade | what it means | renders |
|---|---|---|
| `metered` | measured | the figure |
| `refused` | the brain charged naught — a FACT | `$0` |
| `unknown` | UNRECORDED | **absent**, never `$0.00` |

## .refs

- src/contract/cli/review._.cost.ts                       # `--of run|tree|grove`
- src/domain.operations/review/meter/getOneAccountedCost.ts   # the three-way grade
- .log/bhrain/review/$ts/metrics.realized.json            # the measured record

one command over the `breadth` axis, never one command per position — `--of` names the
position, so all three are expressible and a fourth would need no new command (`F1`).

## .reason

- `term=review.cost._.choice.reason.md`
