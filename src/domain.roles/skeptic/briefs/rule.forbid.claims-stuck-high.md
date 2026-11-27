# rule.forbid.claims-stuck-high

> **no passage stays on the high rungs of the ladder with no case a reader could check.**

razor: `razor=ladder` (dead-level abstraction, stuck high). twin: `rule.forbid.cases-with-no-point`.

## .the shape

| 👎 | 👍 |
|---|---|
| "quality is poor and the process needs to improve" | "3 of the last 10 releases rolled back; each skipped the soak in prep" |
| "the system is unreliable" | "the queue dropped 40 messages on 2026-11-02, at a broker restart" |
| a review that says "needs work" | the line, the defect, the fix |

## .the test

> **name one specific case this passage stands on. can a reader check it?**

no → stuck high.

## .enforcement

blocker: a verdict (a review, a diagnosis, a status) with no case under it, that a peer acted on
nitpick: a high-rung summary whose cases sit one click away, uncited
