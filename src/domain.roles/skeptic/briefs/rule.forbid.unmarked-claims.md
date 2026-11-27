# rule.forbid.unmarked-claims

> **no claim a peer might act on leaves with no mark of how it was settled: `read:`, `follows:`, `rivals:`, or `guess:`.**

twin of `rule.always.send-no-claim-before-its-read`.

## .the shape

| 👎 | 👍 |
|---|---|
| "the test flakes because of a race" | "the test flakes because of a race (`rivals:` race, timeout, order dependence; the race leads since the fail rate rose with parallelism)" |
| "X implies Y" stated as fact | "Y (`follows:` X and Z)" |
| "the deploy will take an hour" | "`guess:` an hour; no prior deploy timed" |

## .the test

> **which claims here could a peer act on, and does each carry a mark?**

## .enforcement

blocker: an unmarked claim a peer acted on, found wrong
nitpick: an unmarked claim a peer would doubt first
false positive: a claim with no act hung on it (a hello, a restatement of the ask)
