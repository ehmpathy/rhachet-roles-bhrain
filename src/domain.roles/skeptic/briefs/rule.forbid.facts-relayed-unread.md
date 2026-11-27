# rule.forbid.facts-relayed-unread

> **no fact about a state, an owner, a number, or what a tool does is relayed or acted on with no read newer than its source's last move.**

twin of `rule.always.trust-but-verify`.

## .the shape

| 👎 | 👍 |
|---|---|
| "the pr is merged" — from a summary, a peer's word, or memory | "the pr is merged (`read:` the pr page, state merged)" |
| "the job is done" — relayed from a subordinate | "the job is done (`read:` the artifact it names exists)" |
| "the flag is not supported" — from a brief or an old error text | "the flag is not supported on v2.3 (`read:` `--help` on the current release)" |
| "it was moved" — the new home read, the old home not | both ends read: new home live, old home gone |

## .the test

> **is this a fact, and is a read beside it, or a `guess:` mark?**

a fact with neither → relayed unread.

## .enforcement

blocker: a fact relayed unread that a peer acted on, found wrong · a costly act (delete, merge, kill, grant) done on a fact no read backed
nitpick: a fact relayed unread, found right (the habit is the defect, not the luck)
false positive: a claim of logic or of choice, marked `follows:` or `rivals:` — it owes no read
