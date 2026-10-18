# F18 · a snapshot this diff did not write is not reworded here

## .the fork
- (a) leave the `phase.degrade.stderr` snapshot of `routeStatusLine.acceptance` as it is
- (b) rewrite the renderer's fault text to drop the engine's `SyntaxError` message, and re-snap

## .taken, and why at the time
(a). the snapshot line is in a suite and a renderer this diff does not touch; the only edit to that
snapshot file is one paragraph of `--help`. the `SyntaxError ... in JSON at position 2` text is the
renderer's extant stderr contract for a corrupt meter file, and the vision names a renderer fault as
out of scope ("a renderer fault is the extant stderr contract"). to reword it here would change a
published stderr line under a fix about a settings file.

## .rework
clean — one message in `stepRouteStatusLine` and one snapshot line; no caller parses it.

## .confidence — 85%, and why it is not higher
the nitpick is right that an engine message reads as debug noise. it is out of this tree's scope, and a
dream is the home for it if the wisher agrees.

## .where
`src/contract/cli/__snapshots__/routeStatusLine.acceptance.test.ts.snap`, the `phase.degrade.stderr` entry.

## .verdict
open — for the wisher
