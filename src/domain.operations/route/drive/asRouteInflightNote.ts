import { ROUTE_INFLIGHT_FRESH_BOUND_LABEL } from './asRouteInflightFreshness';
import type { RouteInflight } from './RouteInflight';

/**
 * .what = renders an epoch-ms instant as a local `HH:MM` clock label
 * .why = the note names when the wait began; minute precision is all a driver needs
 */
const asClockLabel = (input: { epochMs: number }): string => {
  const date = new Date(input.epochMs);
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
};

/**
 * .what = renders the one-line note the stop hook prints for a repairs-in-flight watermark
 * .why = fresh → the quiet note that lets the stop through; stale → the line that names the
 *        expired watermark beside the nudge, so the driver sees why the hook is loud again
 */
export const asRouteInflightNote = (input: {
  of: 'fresh' | 'stale';
  inflight: RouteInflight;
  ageMs: number;
}): string => {
  const since = asClockLabel({ epochMs: input.inflight.since });
  const head = `⏳ repairs in flight for ${input.inflight.stone} since ${since} — ${input.inflight.what}`;
  if (input.of === 'fresh') return head;

  const ageMinutes = Math.floor(input.ageMs / 60_000);
  return `${head} (stale: ${ageMinutes}m old, past the ${ROUTE_INFLIGHT_FRESH_BOUND_LABEL} bound — move the stone, or re-mark --as inflight)`;
};
