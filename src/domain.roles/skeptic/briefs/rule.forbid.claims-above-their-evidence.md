# rule.forbid.claims-above-their-evidence

> **no claim sits on a higher rung of the ladder than its evidence.**

twin of `rule.always.test-a-claim-against-the-whole-it-speaks-for`. razors: `razor=ladder` (the leap) · `razor=hasty-generalization` · `razor=external-validity` · `razor=survivorship`.

## .the shape

| 👎 the claim | the evidence | 👍 |
|---|---|---|
| "the suite is flaky" | one test failed once | "test X failed once on run 412" |
| "users hate the new flow" | two complaints | "two users complained (of N who used it)" |
| "this pattern works" | it worked in one repo | "it worked in repo A, which shares traits P, Q with this one" |
| "every deploy since june passed" | the deploys that were logged | "every logged deploy passed; unlogged: …" |

catch words: "all", "always", "every", "never", "the system", "users", "the team".

## .the test

> **name the rung of the claim and the rung of its evidence. is the claim higher?**

yes → lower the claim to the evidence, or raise the evidence to the claim.

## .enforcement

blocker: a claim one rung or more above its evidence that a peer acted on
nitpick: a scope word ("all", "always", "every") over a count of one or two, with no count stated
false positive: an existential claim ("some", "at least one") backed by one case
