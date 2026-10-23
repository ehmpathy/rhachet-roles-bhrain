# F78 — the overflow gate counts tokens, the census counts chars

- rework = **clean** — the gate reads one local; a swap is one line
- confidence = 🟡 **75%**
- raised.by = r027 enroll-impl-arch-defects-review-ops nitpick.1, at i034

## .the fork

r027 asked that the context-window gate in `compileReviewPrompt` read the prompt composition
rather than `estimateTokenCount` over the same prompt.

| option | what it yields |
|---|---|
| concede | the gate reads `composition.chars`, then needs a chars-to-tokens step anyway |
| dispute | the two answer different questions in different units |

## .taken — dispute

- the gate needs **tokens** of the whole prompt. the composition states **chars** per input and has
  no token figure, so a gate built on it would still route through the chars/4 estimator
- the composition's total equals `prompt.length` by construction, which r027 itself confirms, so
  the two cannot disagree on the total the gate reads
- `estimateTokenCount` is the one home of the estimate. a smarter estimator lands there and the
  gate inherits it; the census is untouched, since it never held a token count

the census attributes; the estimator converts. neither duplicates the other.

## .verdict

🟡 BEST-GUESSED 2026-10-01 — dispute.
