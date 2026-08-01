# domain.term.choice.reason: body

## .etymology
`body` names the substance of a message as opposed to its envelope — the same split http draws
(headers vs body), email draws (headers vs body), and a letter draws (letterhead vs body). here
the envelope is the rhx harness's `🪨 run solid skill …` dispatch banner; the body is what the
skill itself said. the word is instantly legible to any engineer because the header/body split is
universal across message formats.

chosen over the rejected synonyms:
- `content` — too broad; every string is "content". `body` specifically means "content minus the
  envelope", which is the exact distinction the disintermediation makes.
- `payload` — transport jargon (a packet's payload); it reads as network-layer, not as the
  human-legible review text a reviewer reads.
- `guts` — slang, imprecise, and breaks the calm register of the codebase's vocabulary.

## .disputes
none. the term was coined this round with no rival proposal.

## .evidence
- discovery: the banner/body split surfaced while a guard-dispatched `review.by --for` showed a
  DOUBLED `🪨 run solid skill` banner. a name for the review's own output — the "body" — gave the
  transformer that removes the banner a precise handle: `asReviewBodyStdout` (yield the body of the
  stdout), read as "cast this captured stdout to just its body".
- invariant: the body NEVER includes a `🪨 run solid skill` dispatch banner; a banner in what is
  called a "body" is a defect (rule.require.review-by-disintermediates).
