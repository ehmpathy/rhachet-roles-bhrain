import { DomainLiteral } from 'domain-objects';

/**
 * .what = the auto-respawn circuit-breaker state for one driver session's RouteReminder
 * .why = the auto-wire (syncRouteReminderForDrive) runs on every route.drive hook — every turn
 *        boundary, not every ~20min tick. a SYSTEMATICALLY-broken spawn (a bad node binary, a broken
 *        subpath, an OOM) crashes on arrival and re-spawns a fresh doomed process on EVERY boundary —
 *        an unbounded spawn-storm across exactly the host outage the reminder exists to survive. this
 *        state persists the consecutive crash-on-arrival count so the auto-wire can trip a cutoff and
 *        halt the respawn until a human re-arms it with a manual route.reminder.gen. it mirrors
 *        DriveBlockerState (the drive's own consecutive-block cutoff) — a proven primitive, reused.
 */
export interface RouteReminderCrashBreaker {
  /**
   * consecutive crash-on-arrivals since the last live daemon (any alive:true resets it to 0)
   */
  count: number;
}

export class RouteReminderCrashBreaker
  extends DomainLiteral<RouteReminderCrashBreaker>
  implements RouteReminderCrashBreaker {}
