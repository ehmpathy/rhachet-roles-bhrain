# F15 · keep the driver gate, though an unlink runs no init

## .the fork
- (a) keep the link gate (`.agent/repo=bhrain/role=driver`) and `remove_our_line`: an explicit init
  on an unlinked driver skips or takes back our line
- (b) delete the gate and the removal: the init binds whenever it runs, and an unlink leaves the line

## .taken, and why at the time
(a). rhachet runs a role's init only right after it links that role, so an unlink runs no init and
the line stays (pinned by `survives-layout` `[case4]` `[t2]`). but `rhachet roles init --role driver`
and `run --init` run the init on a role that is not linked. with (b) such a run would bind a status
line for a repo actor that does not carry driver, which is the wrong-actor fault this tree fixes.
the gate costs about 45 lines, 6 cases and 3 snapshots, and the claim of "removed on unlink" is cut
from the yield and the vision.

## .rework
clean — the gate is one conditional and two named functions. a delete removes them and the cases
that call them; no caller depends on them.

## .confidence — 78%, and why it is not higher
the explicit-init path is rare, and the reviewers read the gate as dead code in the common flow. a
wisher who prefers fewer branches (`rule.require.fewer-paths-via-idempotency`) would take (b). the
real fix, a role teardown on unlink, is rhachet's, caught as
`.dream/v2026_10_16.reseed.rhachet-unlink-runs-no-role-teardown.md`.

## .where
`src/domain.roles/driver/inits/init.claude.status-line.sh` (`remove_our_line`, `skip_for_no_driver`)
and its integration suites.

## .verdict
open — for the wisher
