# domain.term.choice.reason: sweep

## .etymology
a **sweep** is a light, regular pass that tidies as it goes — the house-care metaphor fits the
learner's hourly habit of glossary care. chosen over `scan` (read-only, implies no authorship),
`pass` (too vague — a pass of what?), and `audit` (heavy, compliance-flavored, and implies an
external checker rather than the learner's own care).

## .disputes
none. no contract has drifted to a synonym of `sweep`.

## .evidence
- discovery: the wish named it — "a sweephook which runs onStop ... to reflect on the terms used
  or engaged with". the noun `sweep` composes the two declared operations that gate its freshness
  (`getSweepProgress`, `isSweepStale`)
- invariants: a sweep is idempotent — a re-run on an already-itemized round is a no-op
  (findsert), so it never churns the glossary
