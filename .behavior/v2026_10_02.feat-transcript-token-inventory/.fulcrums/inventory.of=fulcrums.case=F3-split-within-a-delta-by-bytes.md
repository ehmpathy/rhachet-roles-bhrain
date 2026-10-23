# F3 — split a multi-category delta by byte share

- **fork**: (a) byte-proportional split inside each measured delta · (b) a tokens-per-byte ratio
  calibrated from single-category deltas, remainder → unattributed · (c) refuse to split; report
  only single-category deltas as attributed, all else unattributed
- **taken**: (a), tagged `[apportioned]` on screen. it keeps every row inside a measured total, so
  rows sum exactly; (c) would leave most of a busy session unattributed and name no target; (b) is
  sharper but needs a calibration step whose error is itself unmeasured.
- **rework**: clean — the split is one transformer; (b) can replace it without a contract change.
- **confidence**: 70% — the wish forbids estimates "dressed as measurements"; a reviewer may read
  (a) as that, despite the tag. the tag must sit beside every apportioned number.
- **where**: `1.vision.yield.md` · the three tiers; open question 4
- **verdict**: —

## .retracted — a question for the commander

a vision call (open question 4) best-guessed past rather than asked. withdrawn as a guess; it now
waits on the commander at review. the code holds (a) until ruled; the split is one transformer.

**question:** when one measured token delta holds several content categories, how is it split?

| option | what | cost |
|---|---|---|
| (a) | by byte share, each split number tagged `[apportioned]` | an estimate inside a measured total — may read as one dressed as a measurement |
| (b) | a tokens-per-byte ratio calibrated from single-category deltas; remainder → unattributed | sharper, but the calibration error is itself unmeasured |
| (c) | no split: only single-category deltas are attributed, all else unattributed | honest, but most of a busy session names no target |

**lean:** (a), with the tag beside every apportioned number — rows sum to the measured totals and
every cut target stays named.
