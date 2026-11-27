# rule.forbid.predictions-written-after-the-look

> **no result is called "expected" unless the expectation was written before the look.**

twin of `rule.always.predict-before-you-look`. razors: `razor=feynman` · `razor=overfit`.

## .the shape

| 👎 | 👍 |
|---|---|
| ran the test, then "as expected, it passes" | "expect: pass, since the fix guards the null. ran: pass" |
| a lesson drawn from one run, then "confirmed" by the same run | a lesson drawn from run A, checked on run B |
| a story that fits any outcome ("if it passes, the fix worked; if it fails, the env is flaky") | the outcome that would refute the fix, named before the run |

## .the test

> **was the expectation on the page before the result, and did it name an outcome that would have refuted it?**

## .enforcement

blocker: a result reported as confirmation where no expectation preceded it, and a peer acted on the claim
nitpick: "as expected" with no prior expectation on the page
false positive: an exploration marked as such ("no expectation; a first look")
