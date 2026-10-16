# seed S19 — dogfood the warmer to prove its value, and make the cost tool say so plainly

archived verbatim, before distillation (`rule.always.archive-the-wishers-words-verbatim`).

## .the utterance

asked after a summary that ended *"what's not proven: whether it pays off on a real guard
round"*:

> yeah lets prove this out too

> yeah we want to prove the value of the warmer, dogfood it

> fix the cost tool to make it super clear btw

## .settled

- the warmer's value is a **claim owed proof**, and the proof is measured on this repo's own
  guard rounds, never argued from the eviction probe alone
- value is a NET: cache savings on the real reviews a warmer covered, minus what its pokes cost
- `rhx review._.cost` is the surface that states that net, per lane, so plainly that a reader
  needs no arithmetic of their own to answer *"did the warmer pay for itself?"*

## 🔴 .the question this answers

the eviction probe proved a poke **can** keep a prefix resident. it never proved a poke is
**worth** its bill, since a lane re-reviewed inside the ttl needs no poke, and a lane never
re-reviewed buys naught with one. only a real guard round weighs both.

## .landed in

- `src/domain.operations/review/getOneWarmerValue.ts`
- `src/domain.operations/review/asWarmerValueLines.ts`
- `src/domain.operations/review/meter/asCacheSavedPrice.ts`
- `.agent/repo=.this/role=any/briefs/research.review-cost-and-cache.md` § the warmer on real guard rounds
