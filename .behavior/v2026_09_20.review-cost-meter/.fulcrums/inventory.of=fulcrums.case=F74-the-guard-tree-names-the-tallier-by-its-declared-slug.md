# F74 — the guard tree names the tallier by its declared slug

- rework = **dirty** — every producer of a probabilistic tree state would carry a pinned slug
- confidence = 🟡 **70%**
- raised.by = self, at i033 (r011 ergo-friction-hazards nitpick.1)

## .the fork

the probabilistic tally renders `tallied by reviewer@…` on two surfaces:

| surface | names | source |
|---|---|---|
| the given's footer — the durable record | the **pin** (`…/flash/v4.1`) | `getOneBrainChoicePinned`, at write |
| the live guard tree — the per-round view | the **declared** slug (`…/flash/latest`) | `FIXED_FALLBACK_BRAIN`, at render |

the lane asks the tree to render the pin too.

## .taken — hold

- `getOneBrainChoicePinned` is async (it imports the brains package map); `formatGuardReviewerTree`
  is a sync pure render called from every guard surface. to pin at render makes every tree async
- the alternative carries a `talliedBy` slug in the `pass` tree state, parsed from the footer — a
  field every producer must fill (guard round, `review.by`, live progress, the derived fallback),
  for a slug the given beside it already names
- the tree's `latest` is not false on the day it renders: it names the tier the guard declares.
  the question *"which model tallied this verdict?"* is an audit question, and the given is the
  audit record

## .why confidence is not higher

two surfaces name one fact two ways, and a reader who never opens the given sees only the tier.
a later round may prefer the state field once a second consumer needs the pin.

## .verdict

🔄 REVERSED 2026-10-01, at i035 — the second consumer arrived. r011 raised it again as a blocker
(b2), so the tree now renders the pinned `talliedBy` the given already holds, and the declared
tier no longer stands in for the model that tallied. the snapshots read
`tallied by reviewer@fireworks/deepseek/flash/v4.1`.
