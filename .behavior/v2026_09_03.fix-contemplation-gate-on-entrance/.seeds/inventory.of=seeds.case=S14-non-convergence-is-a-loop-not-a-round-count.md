# seed S14 — non-convergence is a loop, never a round count

## .said — verbatim, 2026-09-07

> why are you on review round 17?

> why have they not converged yet?

## .settled

**a high round count is a symptom. the cause is a cycle in which each correct act enlarges the input
of the next round.**

```
0 commits
  → since-main unions the whole staged + untracked set (394 files)
  → the conversation payload accretes every given + taken + report, forever
  → a lane exceeds its window → returns `constraint`, with no verdict
  → an unreadable verdict scores ONE blocker (asPeerGivenVerdict) → it MINTS a debt
  → the driver writes a .taken to answer it
  → the .taken is appended to the conversation
  → back to line 3, with a larger payload
```

⇒ **every step is correct in isolation, and the composite does not converge.** the driver is not
idle; the driver is at work inside a cycle whose period is one round.

## 🔴 .the two properties that make it self-feed

| property | consequence |
|---|---|
| an **unreadable** verdict is graded as **one blocker**, never zero | a lane that reviewed no code still owes an answer |
| the **answer** to a lane is appended to the **input** of every lane | the discharge and the cause are the same artifact |

the first is correct and must stay — `contract.reviewer-output` says outright that a review with no
numeric count *"can NOT assume zero"*, and a fake clean bill is worse than a halt.

**the second is the defect.** a conversation with no bound turns a rubric that grades a diff into a
rubric that grades its own transcript.

## ⚠️ .what a round count does and does not tell you

- ⛔ **it does not measure effort** — round 17 with a blocker set that descends is convergence
- ⛔ **it does not measure a driver's diligence** — the loop above runs at full effort
- ✅ **it measures period, and a stationary blocker series measures the cycle**

`.route/passage.jsonl` carries the series. a series that neither descends nor terminates over K
distinct hashes is the signature, and it is checkable without a judgment call. ⇒ that is the
divergence terminal the wish itemized as **scope item 2** and fenced out of this behavior.

## .landed

- the root-cause chain above, which is the argument behind S13 (edit the guard) and S15 (do not
  re-open a passed level)
- ⏳ scope item 2 — the divergence terminal — remains fenced; it is now evidenced rather than merely
  proposed
