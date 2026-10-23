# F17 · the real-cli proof lives in two suites; the hand-built fixtures stay

## .the fork
- (a) keep the hand-built split-layout fixtures in the status-line and route-heal suites, and prove
  the external contract (the real rhachet cli, its real layout) in two suites that call the real cli
- (b) replace every hand-built fixture with a layout rhachet lays out, so no test authors rhachet's shape

## .taken, and why at the time
(a). the external contract of this tree is rhachet 1.49's brain-dir layout and its init frame.
`init.claude.status-line.survives-layout.integration.test.ts` drives the real `node_modules/.bin/rhachet`
(layout, init, a second layout, an unlink, a derived peer, three human states) and asserts on what it
produced; `blackbox/driver.init.status-line-survives-enroll.acceptance.test.ts` drives the built `rhx`.
both validate the real response, which is what the rule asks.

the two init suites keep a hand-built layout on purpose: they vary one input at a time (a link, a
malformed file, a dangled grove, a record that lags) in under a second each, and a real rhachet run takes
seconds and cannot produce a dangled arrow or a lagged record on demand. the real-cli suites pin that the
hand-built shape matches rhachet's, so a drift in rhachet turns them red first.

the `genFakeRhx` stand-in in `getCloneAddress.integration.test.ts` is the extant test of an extant
operation; this tree edits one path in it, and does not own its contract.

## .rework
clean — (b) is a test refactor with no prod effect, and the real-cli suites already hold the contract.

## .confidence — 75%, and why it is not higher
a reviewer reads any hand-built layout as authored belief. a wisher who weighs that over the speed of the
per-input suites would take (b), at the cost of a slower suite and no dangled or lagged cases.

## .where
`src/domain.roles/driver/inits/*.integration.test.ts`, `blackbox/driver.init.status-line-survives-enroll.acceptance.test.ts`.

## .verdict
open — for the wisher
