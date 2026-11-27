# rule.forbid.false-dichotomies

> **no choice is offered as two options when a third exists, unless the third was looked for and ruled out.**

razors: `razor=false-dilemma` · `razor=instrument`.

## .the shape

| 👎 | 👍 |
|---|---|
| "either we rewrite it or we live with the bug" | "rewrite, live with it, or patch the one call site" |
| "a big bass, or no bass" | a small body with heavy strings and a pickup |
| "skip the test or fix the flake today" | "skip, fix today, or quarantine with an owner and a date" |

## .the test

> **what third option was looked for, and why was it ruled out?**

## .enforcement

blocker: a binary choice put to a peer whose answer would change with a third option they were not shown
nitpick: an "either/or" in a design with no search for a third named
