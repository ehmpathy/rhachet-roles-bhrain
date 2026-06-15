# define.invariant.review.peer.exhausted

## .what

a peer review can only be `exhausted` if it was **skipped** — never if it ran.

## .invariant

```
ran → NOT exhausted
skipped due to budget → exhausted
```

## .why

the verdict describes what happened to the review attempt:

| situation | rounds | budget | review ran? | verdict |
|-----------|--------|--------|-------------|---------|
| round 1/2 fails | 1 | 2 | yes | rejected |
| round 2/2 fails | 2 | 2 | yes | rejected |
| round 3/2 attempt | 2 | 2 | no (skipped) | exhausted |

the distinction matters:
- **rejected** = review ran, produced blockers, driver must respond
- **exhausted** = review was skipped, budget already spent, level unlocks

## .detection

a review was skipped when `rounds >= budget` **before** the attempt, not after.

in event terms: `outcome.review.exhausted === true` signals the review did NOT run.

## .consequence

terminal verdicts for level composition:
- `approved` — passed thresholds, terminal
- `exhausted` — skipped, terminal (unlocks higher levels)

non-terminal:
- `rejected` — ran but failed, driver must retry
- `queued` — not yet attempted
- `malfunction` — process error, needs investigation

## .enforcement

`computeReviewPeerVerdict` must only return `'exhausted'` when `wasExhausted: true`.
