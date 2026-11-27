# rule.forbid.doubt-out-of-scale

> **no irreversible act goes on a claim checked as lightly as a reversible one; no cheap, reversible step waits on a check heavier than its harm.**

twin of `rule.always.size-the-read-to-the-cost-of-an-error`.

## .the shape

| 👎 | 👍 |
|---|---|
| a prod table dropped on "it is unused", from memory | `read:` zero queries in 30 days of logs, and the owner's word; then the drop |
| a typo fix held for a full suite run and a peer review | the typo fixed; the suite runs as it would anyway |
| a merge on a green check that never ran the changed path | the check that runs the path |

## .the test

> **if this claim is wrong, what does it cost, and can it be undone? does the check match that?**

## .enforcement

blocker: an irreversible act (delete, drop, merge, grant, send) on a claim with no read of its own
nitpick: a cheap, reversible step stalled on a check far heavier than its harm
false positive: a check the act runs anyway (a suite on every push)
