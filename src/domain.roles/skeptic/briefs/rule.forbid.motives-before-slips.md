# rule.forbid.motives-before-slips

> **no intent (malice, laziness, a plan) is assigned to an act a slip, a gap, or a simpler process explains.**

razors: `razor=hanlon` · `razor=morgan` · `razor=rapoport`.

## .the shape

| 👎 | 👍 |
|---|---|
| "they skipped the tests to rush it out" | "the tests did not run; the ci config omits that dir" |
| "the model hides the error on purpose" | "the model's reply drops stderr; the prompt never asked for it" |
| "the team ignored the guard" | "the guard text names a flag the tool lacks" |

## .the test

> **is there a slip, a gap, or a dumb process that would produce the same act?**

yes → weigh it first.

## .enforcement

blocker: an intent assigned to a peer, in a message they read, that a slip explains
nitpick: an intent assigned to a tool or a process
