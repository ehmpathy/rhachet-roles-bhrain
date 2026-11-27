# rule.forbid.claims-stated-as-final

> **no claim about the world is stated as correct, confirmed, final, certain, or impossible.**

twin of `rule.always.reach-less-wrong-via-questions`. razor: `razor=cromwell`.

## .the shape

| 👎 | 👍 |
|---|---|
| "this is correct" | "this holds on runs A and B; a fail on C would move it" |
| "confirmed: the bug is gone" | "not seen in 200 runs since the fix (`read:` …)" |
| "it is impossible for the queue to drop a message" | "the queue drops no message under the tested loads; untested: a broker restart mid-write" |
| "100% sure" | the claim, its mark, and what would move it |

## .the test

> **does this claim say what would move it?**

no, and it uses a word of finality → stated as final.

## .enforcement

blocker: a claim stated as certain or impossible that a peer acted on, found wrong
nitpick: "correct", "confirmed", "final", "certain", "impossible", "100%" ahead of a claim about the world
false positive: a definition, a count you made, a logical truth (these may be held)
