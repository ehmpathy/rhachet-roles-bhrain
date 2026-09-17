# F040 — a later stone's own review debt does not gate this stone

## the fork

`enroll-impl-behavior-intent` (l3, 5.1.execution's own guard) reported 3 blockers and 5
nitpicks. every explicitly-labelled item (blocker.1, blocker.2, nitpick.1) concerns
`5.3.verification._.review.i001.c62e7289ee7f541472` — a review ROUND ON A DIFFERENT STONE,
left unanswered from a prior session. the reviewer's own words: *"there's a live, unanswered
problem at the current active stage that outranks everything here"* — but the current active
stage, per `route.drive`, is `5.1.execution.from_vision`, not `5.3.verification`.

## taken

dispute blocker.1, blocker.2, and nitpick.1 (and the unlabeled "infra blocker" item, which the
reviewer itself grades *"foreman-actionable only; not a code or ergonomic defect"*).

## why disputable

a stone's guard gates on the STATE OF THAT STONE's own deliverable, never on the review debt a
different, later stone happens to be carrying. `5.3.verification` is not yet the active stone —
its own guard, when the driver reaches it, will re-surface this exact debt and hold the ladder
there. to make 5.1.execution's passage conditional on 5.3.verification's stale `.taken` would
mean neither stone's gate is legible on its own: a driver fixing 5.1 would be asked to also
answer a 5.3 review whose own gate has not yet run.

the reviewer's diagnosis is not wrong — the drift it names (case=5's demo predates the
mandatory `--severity` flag; the experience catalog was never evolved for the latest-level
budget scoping) is real. but the fix belongs to 5.3.verification's own round, at 5.3's own
guard, over smuggled into 5.1's passage as a side effect.

## rework

**clean.** no part of 5.1.execution's own deliverable changes if this dispute is wrong — the
worst case is that 5.3.verification's stale debt sits one round longer before its own guard
re-raises it, which it will, mechanically, the moment the driver arrives there.

## confidence

90% — the route's own `route.drive` output is the ground truth for "which stone is active",
and it says 5.1.execution. a reviewer conflating two stones' debt is the over-reach
`rule.forbid.overzealous-blockers` exists to catch (no nameable harm ships from 5.1.execution's
own code by deferring a DIFFERENT stone's review answer to that stone's own round).
