# rule.forbid.part-whole-transfers-unchecked

> **no trait moves from a part to its whole, from a whole to its parts, or across a split of the data, without a check that it survives the move.**

razors: `razor=composition-division` · `razor=simpson`.

## .the shape

| 👎 | 👍 |
|---|---|
| "each module is tested, so the system is tested" | "each module is tested; the seams between them are not" |
| "the team is fast, so each member is fast" | the rate per member, read |
| "the fix raised the pass rate overall, so it helps each suite" | the rate per suite; one may have fallen while the mix shifted |

## .the test

> **does this trait hold at the level it is claimed for, by a read at that level?**

## .enforcement

blocker: a part-to-whole or whole-to-part claim a peer acted on, with no read at the claimed level
nitpick: an aggregate rate compared across groups with no word on how the mix changed
