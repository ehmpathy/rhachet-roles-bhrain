# rule.forbid.first-thoughts-shipped-unquestioned

> **no claim leaves with no counter-take named and no answer put against it.**

twin of `rule.always.trust-no-one-especially-not-yourself` and `rule.always.question-your-first-take`. the always-rule says what to do; this names the shape a reviewer can point at.

## .the shape

| 👎 | 👍 |
|---|---|
| "the cause is the cache" — a diagnosis with no rival and no check | "the cause is the cache (`read:` the miss rate fell to 0 after the flush); the rival, a slow db, fails: query time held at 4ms" |
| "this cannot work" — an impossibility, explained, never asked | "this seems not to work, because X; what would show it can: Y; I checked Y: …" |
| "obviously", "of course", "as before", "I know" ahead of a claim | the claim, its mark, and what would move it |

## .the test

> **for this claim, is a counter-take named, and is an answer (a read, logic, or a rival weighed) put against it?**

no to either → the claim shipped as a first thought.

## .enforcement

blocker: a diagnosis, design, or impossibility shipped with no counter-take and no answer, that a peer acted on
nitpick: "obviously" / "of course" / "I know" ahead of a claim with no answer beside it
false positive: a claim marked `guess:` (a named guess is legal)

see also: `rule.always.trust-no-one-especially-not-yourself.example=the-acoustic-bass-guitar.md`
