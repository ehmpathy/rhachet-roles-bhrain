# rule.forbid.circular-definitions

> **no term is defined by a word at its own rung, or by itself. a definition points down the ladder, to a case or an operation.**

razor: `razor=ladder` (same-rung definitions carry no information).

## .the shape

| 👎 | 👍 |
|---|---|
| "a flaky test is an unreliable test" | "a flaky test passes and fails on the same commit with no code change" |
| "stale means out of date" | "stale: its source changed after the read" |
| "done means complete" | "done: merged to main and deployed to prod" |

## .the test

> **could a reader sort a case into or out of this term from the definition alone?**

no → the definition moved sideways, not down.

## .enforcement

blocker: a term in a contract or a gate whose definition a reader cannot apply to a case
nitpick: a same-rung gloss in prose
