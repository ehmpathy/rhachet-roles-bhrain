import { type IsoDuration, toMilliseconds } from 'iso-time';

import type { RouteInflight } from './RouteInflight';

/**
 * .what = how long a repairs-in-flight watermark quiets the stop hook
 * .why = a delegate that ran this long has likely died or been forgotten; past the bound
 *        the hook nudges again, so a stale watermark cannot mute a stalled route forever
 */
export const ROUTE_INFLIGHT_FRESH_BOUND: IsoDuration = { minutes: 30 };

/**
 * .what = the fresh bound as the `Nm` label each rendered message prints
 * .why = derived from the bound itself, so a moved bound cannot leave a stale number in copy
 */
export const ROUTE_INFLIGHT_FRESH_BOUND_LABEL = `${Math.floor(
  toMilliseconds(ROUTE_INFLIGHT_FRESH_BOUND) / 60_000,
)}m`;

/**
 * .what = decides whether a repairs-in-flight watermark applies to the current stone, and
 *         whether it is still fresh
 * .why = the stop hook is quiet only for a fresh watermark on the stone it would nudge;
 *        a watermark for another stone is not this stone's wait, so it reads as absent
 */
export const asRouteInflightFreshness = (input: {
  inflight: RouteInflight | null;
  stone: string;
  now: number;
}):
  | { of: 'absent' }
  | { of: 'fresh'; inflight: RouteInflight; ageMs: number }
  | { of: 'stale'; inflight: RouteInflight; ageMs: number } => {
  // no watermark, or one for another stone → not this stone's wait
  if (!input.inflight) return { of: 'absent' };
  if (input.inflight.stone !== input.stone) return { of: 'absent' };

  // the age the message renders, never below zero
  const deltaMs = input.now - input.inflight.since;
  const ageMs = Math.max(0, deltaMs);

  // within the bound → fresh; at or past it → stale
  // .note = the bound is on the DISTANCE between the stamp and now, so a wall clock that
  //         steps backward (an NTP slew, a snapshot restore) cannot hold a watermark fresh
  //         past the bound — a stamp more than the bound in the future reads stale too
  //         (rule.forbid.behavior-hazards)
  if (Math.abs(deltaMs) < toMilliseconds(ROUTE_INFLIGHT_FRESH_BOUND))
    return { of: 'fresh', inflight: input.inflight, ageMs };
  return { of: 'stale', inflight: input.inflight, ageMs };
};
