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
 *        getRouteDriveFrontier snapshot so the two never disagree.
 *
 * .why the stones-exist guard = the frontier is empty for TWO shapes: a truly-complete route (all
 *        stones passed) AND a route with NO stones enumerable (a passage-only fixture, or a route
 *        mid-scaffold). only the FIRST is a completion; the second is indeterminate. so completion
 *        is confirmed ONLY when stones exist AND the frontier is empty — an empty frontier with no
 *        stones is NOT a completion, so the reminder stays gated on status alone.
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

  // confirmed completion ⟺ stones exist AND the frontier is empty (all passed)
  return {
    complete: frontier.stones.length > 0 && frontier.nextStones.length === 0,
  };
};
