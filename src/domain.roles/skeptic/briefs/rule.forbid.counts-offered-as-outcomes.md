# rule.forbid.counts-offered-as-outcomes

> **no count of acts (files touched, tests added, tickets closed, rules written) is offered as proof the goal was met.**

razor: `razor=goodhart`.

## .the shape

| 👎 | 👍 |
|---|---|
| "added 40 tests" | "the bug class that shipped twice now fails in ci (`read:` the test that catches it)" |
| "closed 12 tickets this week" | "the 3 tickets that blocked the release are closed" |
| "17 rules written" | "a reviewer caught 4 defects with them that it missed before" |

## .the test

> **what outcome did these acts change, by what read?**

## .enforcement

blocker: a goal reported met on a count alone, and a peer acted on it
nitpick: a count led with, the outcome left unstated
