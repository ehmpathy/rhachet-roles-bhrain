# rule.forbid.confirmations-that-rule-out-no-rival

> **no read is reported as confirmation unless it would have looked different under a named rival.**

twin of `rule.always.weigh-a-read-by-what-it-rules-out`. razors: `razor=duhem-quine` · `razor=base-rate`.

## .the shape

| 👎 | 👍 |
|---|---|
| "the logs show errors, so the deploy broke it" — errors were in the logs before the deploy too | "the error rate rose from 0.1% to 4% at the deploy hour; under the rival (a traffic spike), the rate per request would hold" |
| "the test passed, so the fix works" — it passed before the fix too | "the test failed before the fix, passed after" |
| "the read refutes the claim" — with no word on what else the read leaned on | "the read refutes the claim, or the fixture; the fixture checks out (`read:` …)" |

## .the test

> **name the rival. would this read have looked the same under it?**

yes, or no rival named → the read confirms naught.

## .enforcement

blocker: a diagnosis or design acted on whose only support is a read that the rival predicts too
nitpick: a confirmation reported with no rival named
false positive: a claim with one rival only, where logic rules the others out (say so)
