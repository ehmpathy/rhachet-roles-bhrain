# F045 — a concede always exits 2, because the repair is owed THIS round

## the fork

behavior-intent-coverage (r008, i009) nitpick.1: `isGuardExitRequired` exits 2 on every
`--as conceded`, regardless of whether the conceded concern currently holds the road (e.g. a
`better` concession on an approved lane, which the judge sheds). suggests a derive of the exit
from whether the concern actually holds, as a parallel to the dispute path (which correctly
exits 0 when shed).

## taken

dispute. `isGuardExitRequired`'s own docblock already argues this, deliberately: *"a concede
exits 2 ... the driver owes a fix and a re-arrive, so exit 0 would tell a hook the stone is
clear when it is not."* the design is not an oversight of the dispute/concede symmetry — the
two are asymmetric BY DESIGN, and for a reason unrelated to whether the concern currently holds
the tally.

the `concede` term cluster states the invariant this rests on: *"concede is the DEFAULT, and the
repair is owed THIS round. a concession that is not repaired this round is a lazy deferral, not
a concession — there is no 'later, it's minor' door"* (`rule.forbid.lazy-review-deferrals`). a
concede is a COMMITMENT independent of the judge's current residual tally — the driver still
owes the fix even where the concern happens not to hold the road this round.

## why disputable

the dispute path's exit-0 and the concede path's exit-2 answer different questions: dispute asks
*"does this concern still hold the road?"* (no → exit 0, the driver's next act is `--as passed`);
concede asks *"did the driver just commit to a same-round repair?"* (yes, always → exit 2, the
driver's next act is the fix). an exit derived from "does it hold" would let a driver's own
commitment go unenforced whenever the residual happens to clear — exactly the *"later, it's
minor"* door `rule.forbid.lazy-review-deferrals` forbids.

## rework

dirty — an exit derived from the residual tally would remove the enforcement mechanism that
makes concede-and-fix-this-round a real commitment over an optional one.

## confidence

85% — the design intent is stated explicitly in the code's own docblock and cross-confirmed by
the `concede` term cluster and `rule.forbid.lazy-review-deferrals`.
