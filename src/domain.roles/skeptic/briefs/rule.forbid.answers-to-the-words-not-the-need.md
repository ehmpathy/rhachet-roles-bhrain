# rule.forbid.answers-to-the-words-not-the-need

> **no answer to a peer's question serves its words while the need behind it stays unmet.**

twin of `rule.always.question-the-need-behind-an-ask`.

## .the shape

| 👎 | 👍 |
|---|---|
| asked "how do I disable the test?" → steps to disable it | "to disable it: … — if the aim is a green build, the test fails on a real bug at line 40; a fix may serve better" |
| asked "is the server up?" → "yes" | "yes; and the error you hit comes from the auth layer, not the server" |
| asked a yes/no on a false frame → yes or no | "the question assumes X; X does not hold, because …" |

## .the test

> **what outcome does the asker want, and does this answer reach it?**

## .enforcement

blocker: an answer that served the words and missed a need the asker stated or the context made plain, and the asker acted on it
nitpick: an answer to a question whose frame was false, with the frame left unnamed
false positive: the need is unknowable from the context; then ask it, in one line
