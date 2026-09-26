/**
 * .what = the DEFAULT jitter ratio applied to a RouteReminder's sleep interval (±10%)
 * .why = vision Q2 resolved the cadence as "off-minute to avoid fleet clusters" — a bounded
 *        random stagger so many daemons that register together do not tick in lockstep (a
 *        `rhx clone say` burst that piles onto each interval boundary).
 */
export const DEFAULT_REMINDER_JITTER_RATIO = 0.1;

/**
 * .what = applies bounded ±ratio jitter to an interval, so daemons decorrelate their ticks
 * .why = names the jitter math so the daemon loop reads as narrative and carries no inline
 *        decode-friction (rule.forbid.inline-decode-friction). vision Q2's off-minute stagger.
 *
 * .note = `random` is INJECTED (the daemon defaults it to Math.random) so a test pins it to 0.5
 *         for an exact, un-jittered interval — random()=0.5 → offset 0 → the interval unchanged.
 */
export const getRouteReminderJitteredMs = (input: {
  intervalMs: number;
  ratio: number;
  random: () => number;
}): number => {
  // map random()∈[0,1) to an offset in [-ratio, +ratio], then scale the interval by (1 + offset)
  const offset = (input.random() * 2 - 1) * input.ratio;
  return Math.round(input.intervalMs * (1 + offset));
};
