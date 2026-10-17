# F19 · a repair after a lane's last round is read by the council, not the lane

## the fork
- (a) record the repair in the `.taken`, dispute the exhausted lane's two points to the council, and
  point the council at the proof
- (b) leave the points un-disputed, so a blocker the lane cannot re-read holds the stone until a human
  overrules it

## .taken, and why at the time
(a). `ergo-contract-snapshots` raised its last blocker in round 3 of 3: three `permissions.route` snapshot
variants were absent. they are written now: `[case2]` `[t1]`, `[case7]`, `[case8]` in
`init.claude.permissions.route.integration.test.ts`, each snapped from real stdout, 146 init tests green.
the lane is exhausted, so it cannot read the repair. a dispute does not claim the point was wrong; it
hands the council a point already repaired, with its proof, in place of a stone that stays held by a
verdict the lane can never revise. the nitpick (an acceptance file for the route heal) is a design call:
the one built-`rhx` journey already frames both inits and snaps both blocks.

## .rework
none — the repair stands either way. if the council wants the point re-read, the lane needs a budget top-up.

## .confidence — 80%, and why it is not higher
a council that reads every dispute as a refusal to fix would want the stone held. here the fix is in the
tree and tested.

## .where
`src/domain.roles/driver/inits/init.claude.permissions.route.integration.test.ts`,
`src/domain.roles/driver/inits/__snapshots__/init.claude.permissions.route.integration.test.ts.snap`.

## .verdict
open — for the council
