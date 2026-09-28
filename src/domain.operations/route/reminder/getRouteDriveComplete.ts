import {
  getRouteDriveFrontier,
  type RouteDriveFrontier,
} from '../stones/getRouteDriveFrontier';

/**
 * .what = whether a route's drive is COMPLETE — every stone passed, no next stone to drive
 * .why = a completed route is a HALTED drive, so the reminder must reap, not nudge (the wish's
 *        "halt for any reason, no infiniloops"). the passage status alone cannot tell completion
 *        from a mid-route pause: BOTH write the same `passed` tail. the stone frontier is the
 *        discriminator — no next stone ⇒ the drive is done. this mirrors stepRouteDrive's own
 *        completion test (`nextStones.length === 0 → route complete`), read through the SAME
 *        getRouteDriveFrontier snapshot AND by the same rule, so the two can never disagree.
 *
 * .why the frontier ALONE decides (no stones-exist guard) = an empty frontier arises for two shapes:
 *        a truly-complete route (every stone passed) AND a route with no stones enumerable (a
 *        passage-only route, one whose stones were pruned/renamed after the drive finished, one
 *        mid-scaffold). it is tempting to read only the FIRST as a completion and call the second
 *        indeterminate — but stepRouteDrive, the authority on "is there a next stone to drive?",
 *        does NOT make that distinction: it answers `nextStones.length === 0 → route complete! 🌴🤙`
 *        on the frontier alone (stepRouteDrive.test case3, "no stones = all done"). so a
 *        stones-exist guard here does not add caution — it SPLITS the two verdicts: the drive would
 *        answer "complete, stop" while the reminder answered "active, nudge on", and the daemon
 *        would nudge a session whose every drive replies `complete`. that unbounded nudge is
 *        precisely the wish's forbidden infiniloop, and it evades BOTH other exit doors (a terminal
 *        `passed` tail reads LIVE by status, and the clone is still reachable). one read, one
 *        verdict: no next stone ⇒ no drive to advance ⇒ the reminder reaps
 *        (rule.require.clamp-edge-cases — clamped on the CLASS in stepRouteReminderTick.integration
 *        case8 and getRouteReminderDriveActivity.integration case4).
 *
 * .why the optional pre-read = stepRouteDrive already reads the frontier once for its own next-stone
 *        pick, so it threads that ONE snapshot down through here (via getRouteReminderDriveActivity)
 *        rather than have this read it a second time — the single-read-threaded discipline that
 *        avoids a TOCTOU split and halves the I/O on every hook call. callers with no frontier in
 *        hand (the daemon tick, the manual cli) omit it, and this reads its own — so their laziness
 *        holds (a dead-status route never reaches here, so it never pays the frontier read).
 *
 * .note = this closes the terminal-completion gap the status predicate structurally cannot see. it
 *         is folded into getRouteReminderDriveActivity (the one composite "is the drive active?"
 *         read), which three callers consume: the auto-wire (syncRouteReminderForDrive) reaps on
 *         the drive that observes completion, the daemon's own tick (stepRouteReminderTick)
 *         self-exits on completion — a hard no-ifniloop guarantee at the daemon layer, not only on
 *         a later route.drive — and the manual cli (routeReminderGen) reports honest liveness.
 */
export const getRouteDriveComplete = async (input: {
  route: string;
  frontier?: RouteDriveFrontier;
}): Promise<{ complete: boolean }> => {
  const frontier =
    input.frontier ?? (await getRouteDriveFrontier({ route: input.route }));

  // completion ⟺ no next stone — the SAME rule stepRouteDrive applies to the SAME snapshot
  return { complete: frontier.nextStones.length === 0 };
};
