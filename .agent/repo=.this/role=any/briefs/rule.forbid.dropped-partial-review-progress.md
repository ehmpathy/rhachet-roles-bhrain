# rule.forbid.dropped-partial-review-progress

> **when one review in a set fails, every review that succeeded is kept, written, and reported.
> a failure may add a concern; it may never erase a verdict already paid for.**

## .why

- each completed review spent real money and real wall time. a throw that discards it buys the
  same verdicts again on the re-run, at full price
- the completed verdicts are **information**: concerns a driver can answer now, while the failed
  piece re-runs. to drop them hides real blockers behind a malfunction
- a malfunction that reports zero of its completed findings reads to a driver as "naught was
  learned", which is false

## .the shape

| the set | on a partial failure |
|---|---|
| partitions of one lane | settle all (`Promise.allSettled`). write every completed section into the merged report; write a section per failed partition that names the error and the re-run. the failed partition counts as one blocker, never zero (`contract.reviewer-output`: an unread verdict cannot be assumed clean) |
| lanes of one level | each lane's given stands on its own; one lane's fault never voids another's |
| a retry | the retry is per failed piece, never a re-run of the whole set |

## .the test

> **after this failure, which completed verdicts can a driver still read?**

all of them → honest · any fewer → this rule.

| when… | then… |
|---|---|
| you write `Promise.all` over reviews | 🔴 `all` rejects on the first fault and drops the rest. use `allSettled` |
| a `catch` rethrows from a loop of reviews | the results collected so far die with the stack. collect, then report |
| a failed piece is scored as zero blockers | 🔴 that turns a fault into a false approval. score it one blocker, named |
| a refusal (an overflow) stops the set | the other pieces still report. the refusal is one section, not the verdict |

blocker: a review set that discards completed verdicts on a failure · a `Promise.all` over
independent reviews · a failed piece scored as clean.

⇒ see also: `rule.forbid.serial-reviews-that-could-pour` (the peer) · `contract.reviewer-output`
(bhrain/role=reviewer — why an unread verdict counts as a blocker).

worked example: `stepReviewByPartitions` threw on a second brain fault in partition N, and the
N-1 verdicts already written never reached the lane's given.
