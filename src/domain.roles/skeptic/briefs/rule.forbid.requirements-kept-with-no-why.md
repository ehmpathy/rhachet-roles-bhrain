# rule.forbid.requirements-kept-with-no-why

> **no requirement earns a mechanism while no one can state its why; no fence is cleared while no one has read why it stands.**

twin of `rule.always.ask-why-then-ask-can-we-delete`. razors: `razor=chesterton` · `razor=hume-is-ought`.

## .the shape

| 👎 | 👍 |
|---|---|
| "we must support format X" — built, never asked why | "format X: needed by client C for import (`read:` their spec)" — or deleted |
| a guard removed because "it looks unused" | "the guard was added for incident I; that path is gone (`read:` …); removed" |
| "we ought to add a retry" — from "the call fails sometimes" | "the call fails 2% of runs; a retry is owed if the goal is a green run, not a fix of the cause" |

## .the test

> **for this requirement, or this removal: can its why be stated, and was it read?**

## .enforcement

blocker: a mechanism built for a requirement no one can state the why of · a fence removed with no read of why it stands
nitpick: an "ought" drawn from an "is" with no goal named
false positive: a requirement whose why is in the ask itself, quoted
