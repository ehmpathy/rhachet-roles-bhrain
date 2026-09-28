import type { PassageReport } from '@src/domain.objects/Driver/PassageReport';

/**
 * .what = the liveness of a RouteReminder for EVERY passage status — an EXHAUSTIVE map
 * .why = the daemon's U3 no-infiniloop guarantee rests on this one classification, so it must
 *        fail CLOSED, never open. a `satisfies Record<PassageReport['status'], boolean>` makes a
 *        new 11th status a COMPILE error until it is classified here — the wrong state is
 *        unrepresentable, not merely guarded (rule.require.pitofsuccess). a prior denylist
 *        (`!ABSENT.includes(status)`) failed OPEN: a new status silently defaulted to "live" and
 *        would nudge a dead route — the exact infiniloop the wish forbids. this map inverts that.
 *
 * .the one question that decides a row = must a HUMAN act before the drive can advance? if yes,
 *        the reminder is dead — a nudge to a driver who cannot move IS the infiniloop. if the
 *        DRIVER can act, it is live, and a driver who can act yet does not is exactly the stall
 *        U5 asks the nudge to poke.
 *
 * live (true, nudge sent) — the drive can still advance itself:
 * - 'passed'       = a mid-route `passed` IS an active drive (U5 stall risk); terminal completion
 *                    is caught by the stone frontier, not by status (see the predicate note)
 * - 'approved'     = a review level cleared; the drive advances
 * - 'arrived' / 'promised' / 'absorbed' = review-flow markers; the driver drives its own review
 *                    convergence — exactly where it may stall (U5)
 * - 'disputed' / 'conceded' = a per-concern stance the DRIVER authored. a dispute drops the
 *                    concern from the judge's tally; a concede owes a fix the driver itself
 *                    applies. both are forward motion, so both keep the nudge
 * - 'poured'       = a review level has begun to run — a latch, never passage; the level is in
 *                    flight, so the drive is mid-motion
 * - 'overruled'    = a human forgave a level; the drive advances
 *
 * dead (false, daemon exits) — a human, not a nudge, must act (a nudge would be the infiniloop):
 * - 'blocked'      = a hard driver wall (incl. awaited-approval, which is blocked+approval)
 * - 'rewound'      = the stone was parked for fresh evaluation
 * - 'exhausted'    = peer-review budget spent; a human must approve or extend
 * - 'malfunction'  = a reviewer or judge broke; a human must repair
 */
export const REMINDER_LIVENESS_BY_STATUS = {
  passed: true,
  approved: true,
  arrived: true,
  promised: true,
  absorbed: true,
  disputed: true,
  conceded: true,
  poured: true,
  overruled: true,
  blocked: false,
  rewound: false,
  exhausted: false,
  malfunction: false,
} satisfies Record<PassageReport['status'], boolean>;

/**
 * .what = decides whether a RouteReminder is live for a single passage status
 * .why = the daemon's exit decision rests on one predicate — is the drive still an active
 *        self-advanceable drive? this is the pure, deterministic core the tick reads each
 *        cycle. it is the reminder-domain twin of isReviewPeerVerdictTerminal: one named
 *        place that defines "live vs dead", so the exit rule cannot drift across callers.
 *
 * live (nudge sent) = every status EXCEPT the four dead/parked/human-wait states. so an
 * in-motion drive — arrived / promised / absorbed (the machine's own review work), disputed /
 * conceded (a per-concern stance the driver authored), poured (a level in flight), approved,
 * overruled, passed (advanced to the next stone) — keeps its nudge.
 *
 * .note = the vision's exit set, reconciled with the real passage model. the vision names a
 *         conceptual exit set {blocked, rewound, completed, in-review}; the actual
 *         PassageReport statuses hold NO `completed` and NO `in-review`. the two conceptual
 *         names map as follows:
 *
 *         - `completed` = the terminal stone `passed`. status ALONE cannot tell a terminal
 *           `passed` from a mid-route `passed` (every advanced stone writes `passed`), so THIS
 *           status map alone structurally cannot catch completion. completion is caught by a
 *           SEPARATE stone-frontier check (getRouteDriveComplete), folded on top of this status map
 *           inside getRouteReminderDriveActivity — across three teardown layers:
 *
 *           1. [WIRED — the route-system deregister] `route.drive` (via syncRouteReminderForDrive)
 *              reaps the reminder on the first drive that reads the route not an active drive. it
 *              reads getRouteReminderDriveActivity, which folds getRouteDriveComplete (the
 *              stone-frontier check) ON TOP of this status map — so it reaps BOTH the four dead
 *              statuses (blocked / rewound / exhausted / malfunction) AND a terminal completion
 *              (every stone passed, empty frontier), even though completion presents as `passed`
 *              (LIVE by this status map alone). a mid-route `passed` keeps its nudge (non-empty
 *              frontier → active); a terminal `passed` is reaped (empty frontier → complete), so U5
 *              stays covered with no residual nudge at a finished drive.
 *           2. [WIRED — the daemon's own tick] stepRouteReminderTick reads the SAME
 *              getRouteReminderDriveActivity composite, so the daemon self-exits on completion on
 *              its own next tick — the stone-frontier check catches completion at the daemon layer
 *              too, not only on a later route.drive.
 *           3. [WIRED — the last backstop] the dead-session door. once the completed drive's
 *              session exits, the next tick's `clone say` fails reach-state → the daemon self-exits.
 *
 *           so a mid-route `passed` stays LIVE (U5's stall risk), and a terminal completion is
 *           reaped PROMPTLY by the stone-frontier check — same-drive (layer 1) or same-tick (layer
 *           2), not left to the dead-session door. the residual is vanishingly narrow: only a
 *           completion that lands between two ticks, on a still-open session, yields at most one
 *           harmless no-op nudge before the next tick's frontier check reaps it — never repeated
 *           work, never the wish's infiniloop.
 *         - `in-review` = the review-flow markers arrived / promised / absorbed, the per-concern
 *           stances disputed / conceded, and the level latch poured. in THIS route design the
 *           driver drives its OWN review convergence, so a stone in review is an active
 *           self-drivable state — exactly where a driver may stall (U5 hesitancy). the nudge
 *           therefore stays live through review, by design.
 *
 *         exhausted / malfunction ARE dead: a spent review budget or a broken reviewer needs a
 *         human, not a nudge — so they extend the vision's set rather than contradict it.
 */
export const isReminderLiveForPassageStatus = (input: {
  status: PassageReport['status'];
}): boolean => REMINDER_LIVENESS_BY_STATUS[input.status] === true;
