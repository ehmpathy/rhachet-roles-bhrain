# F28 — the key-absent refusal render belongs to rhachet

- **the fork:** the `review.key-absent` and `review.by.key-absent` snapshots pin a refusal that
  opens with a bare `✋ ConstraintError: ` header and a raw `attempts: [...]` json row. (a)
  re-render it here · (b) leave the render where it is owned, and pin it as shipped
- **taken:** (b). the shape is on `origin/main` unchanged; this pr moved one value in it, the
  `--vault <vault>` fix text, which the rhachet 1.50.1 pin wrote. the render is rhachet's keyrack
  fault (its error message plus its metadata). to re-render it here would fork a contract a peer
  package owns, and the snapshot would then pin a render no consumer sees
- **the cure owed:** a reseed to rhachet, caught as a dream: render `attempts` as a tree, and drop
  the empty header
- **rework:** clean — a re-pin and a resnap once rhachet ships the render
- **confidence: 85%**
- **where:** `blackbox/__snapshots__/review.key-absent.acceptance.test.ts.snap`,
  `review.by.key-absent.acceptance.test.ts.snap`
