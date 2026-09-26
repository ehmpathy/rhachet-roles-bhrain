/**
 * .what = the auto-respawn cutoff — after this many CONSECUTIVE crash-on-arrivals, the auto-wire
 *         halts the respawn of a driver session's RouteReminder daemon until a human re-arms it.
 * .why = a systematically-broken spawn crashes on arrival every route.drive hook; unbounded, that is
 *        a spawn-storm. a small cutoff trips fast (the reminder is an auxiliary aid — a few failed
 *        boots prove the spawn is broken, not flaky), unlike the drive's own maxBlocks=21, which
 *        paces a HUMAN across many turn boundaries. 5 permits a couple of transient retries before it
 *        latches, then halts loud (surfaceRouteReminderFault) until a manual route.reminder.gen.
 *
 * .note = the breaker trips when count EXCEEDS this value (count > MAX), the same > comparison the
 *         drive's maxBlocks cutoff uses — so 5 permits boots 1..6 and latches on the 6th consecutive
 *         crash, a mirror of stepRouteDrive's `state.count > maxBlocks`.
 */
export const MAX_ROUTE_REMINDER_CRASHES = 5;
