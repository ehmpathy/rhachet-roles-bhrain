# domain.term: feedback

term.chosen   = feedback
term.kind     = noun                 # noun | verb | adj — reused across objects & operations
term.boundary = review
term.synonyms.forbidden:
- (none declared yet)

## .what

**one reviewer's whole round of critique-and-response — the `given` and its `taken`, taken
together, whether or not the driver has yet answered it.**

`given` and `taken` name the two HALVES of one exchange — the reviewer's critique, and the
driver's answer to it. neither word names the pair. an operation whose subject is the pair —
"has the driver's `.taken` answered this reviewer's latest `.given`?" — needs a third word, and
`feedback` is it.

| the term | its subject | the operation that reads it |
|---|---|---|
| `given` | the reviewer's HALF alone | `getAllRouteGuardReviewPeerGivens` — enumerates givens |
| `taken` | the driver's HALF alone | (enumerated the same way, on the taken side) |
| `feedback` | the PAIR, as a unit | `setStoneAsFeedbackAbsorbed` — confirms the taken answers the given |

⇒ **"absorb the feedback" is the coarse grain of `absorb`** (`define.invariant.review.peer.absorb`):
the driver has fully engaged one reviewer's round when every concern that reviewer raised carries
a disposition. that is a claim about the PAIR — the given (what was raised) checked against the
taken (what was answered) — never about the given alone.

## .refs

- `src/domain.operations/route/stones/setStoneAsFeedbackAbsorbed.ts`
- `src/domain.operations/route/guard/review/peer/getRouteGuardReviewPeerFeedbackAbsorptionStatus.ts`
- `src/domain.operations/route/guard/review/peer/getAllRouteGuardReviewPeersFeedbackUnabsorbed.ts`
- `src/domain.operations/route/guard/tree/formatRouteGuardReviewPeerFeedbackAbsorbPrompt.ts`

## .reason

see the ref-level cluster beside this choice:
- `term=route.guard.review.feedback._.choice.reason.md` — etymology, the dispute that minted it
- `term=route.guard.review.given._.choice.reason.md` § `.disputes` — the settlement, verbatim
