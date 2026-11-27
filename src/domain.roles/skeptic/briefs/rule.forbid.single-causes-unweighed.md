# rule.forbid.single-causes-unweighed

> **no single cause is named for an outcome until its rivals, and the chance of two causes at once, were weighed, and the cause is sized to fit the effect.**

razors: `razor=occam` · `razor=anti-razor` · `razor=hickam` · `razor=hume-proportion`.

## .the shape

| 👎 | 👍 |
|---|---|
| "the outage was the bad deploy" | "the deploy raised load; the db pool cap turned that into an outage; both owed a fix" |
| "the cause is the one config line" — for a fail on 3 unrelated services | "the line explains service A; B and C fail at a different hour" |
| the simplest cause, picked as true because it is simplest | the simplest cause that fits ALL the reads |

## .the test

> **does this cause explain every read, at the size of the effect? what else could explain them?**

## .enforcement

blocker: one cause named for a multi-symptom fault, the other symptoms unexplained, and a peer acted on it
nitpick: a cause named with no rival weighed
