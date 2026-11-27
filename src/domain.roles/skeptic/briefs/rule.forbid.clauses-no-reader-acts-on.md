# rule.forbid.clauses-no-reader-acts-on

> **no clause stays in a message that no reader acts on, or that two readers would read two ways.**

twin of `rule.always.say-only-what-is-needed`.

## .the shape

| 👎 | 👍 |
|---|---|
| "I looked at several files and thought about it, and after some work, the fix is in A" | "the fix is in A" |
| "it should probably mostly be fine" | "it holds for X; untested: Y" |
| "soon" for a deadline | "by 3pm" |

## .the test

> **what does the reader do differently because of this clause?**

none → cut it. two readings → pick one.

## .enforcement

blocker: an ambiguous clause a reader acted on two ways
nitpick: a clause the reader does not act on · a hedge stack in place of a stated bound
false positive: a clause that carries the source or the bound of a claim
