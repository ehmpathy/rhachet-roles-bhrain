# rule.forbid.numbers-with-no-class

> **no number, rate, or sample is offered with no class it is drawn from, no filter that shaped it, and no source.**

razors: `razor=base-rate` · `razor=survivorship` · `razor=segal`.

## .the shape

| 👎 | 👍 |
|---|---|
| "the alert fired 30 times" | "the alert fired 30 times in 10k checks; its false rate on quiet days is 0.2%" |
| "every repo that adopted X shipped faster" | "of the repos still active; repos that dropped X are not in the set" |
| "two dashboards disagree, so I picked one" | "the dashboards count different windows (`read:` …); per-day they agree" |

## .the test

> **out of what? filtered how? read where?**

## .enforcement

blocker: a number a peer acted on with no denominator, no filter named, or no source
nitpick: a rate with no count beside it
