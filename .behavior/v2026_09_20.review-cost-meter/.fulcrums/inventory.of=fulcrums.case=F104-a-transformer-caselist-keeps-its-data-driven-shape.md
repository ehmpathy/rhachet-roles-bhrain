# F104 — a transformer caselist keeps its data-driven shape

## .the fork

`mech-given-when-then` @ 5.3.verification i003, nitpick.2 (review partition, 28 suites) and
nitpick.4 (route partition, 7 suites): pure unit suites iterate a `TEST_CASES` table into jest's
`test()`, with no `given` / `when` / `then`.

- (a) concede it — reshape all 35 suites into `given('[caseN]')` → `when('[t0]')` → `then`
- (b) dispute it — the table form is the shape a peer rule prescribes for exactly these suites
- (c) halt for a human

## .taken — (b), and why at the time

two mechanic rules govern these suites, and they agree:

- `rule.require.given-when-then` makes the frame **required** for integration tests and only
  **recommended** for unit tests. the reviewer grades it a nitpick for that reason
- `rule.prefer.data-driven` asks for caselist tests "especially unit tests of transformers", and
  its worked example is the exact shape flagged here: `TEST_CASES.map(thisCase => test(...))`

every flagged suite is a pure transformer or predicate (`isPathMatchedByGlob`,
`asFigureHuman`, `asGuardCmdFreeOfNpx`, …). a table reads one row per edge, and each row's
`description` already names the scene. to wrap each row in a `given` / `when` / `then` adds two
frames per row and no new information, and it would split one table across 35 hand-written blocks.

## .rework — clean

a reshape is mechanical, file-local, and touches no product code. it can land at any time.

## .confidence — 88%

both rules are unambiguous in text. the residual is a council that prefers one frame everywhere
over the transformer carve-out the data-driven rule gives.

## .where

the 35 suites listed in the i003 given, nitpick.2 and nitpick.4.

## .amended 2026-10-12 — r007 (i003, 5a90324b82)

- the citation above reads "only recommended". the full rule (`rule.require.given-when-then.md`,
  `.where`) reads "required for integration tests and **expected** for unit tests"; only its
  `.min` reads "recommended". corrected: **expected** — a soft requirement short of required, and
  the lane grades it nitpick for that reason
- the hold does not rest on that word. it rests on `rule.prefer.data-driven`, which names this
  exact shape for transformer units
- confidence drops 88% → 80%: "expected" leans further toward the frame than "recommended" did
- `.where` extends: the class covers every pure transformer or predicate caselist this branch
  adds — the warmer, meter, partition, route-guard, route, fs, utils, and review.by partitions
  (r007 nitpick.1, .3, .4, .8, .11, .12, .14, .15)

## .verdict

— (awaits the council)
