/**
 * .what = the default wall-clock bound on a single `rhx clone say` inject call (30s)
 * .why = a hung inject must never wedge the daemon tick forever, so `sayToClone` bounds the call
 *        and converts a wedge into a loud fault. 30s is generous for a call that should answer in
 *        ms. this is the DEFAULT: an operator on a slow/loaded machine can widen it via the
 *        `--say-timeout-ms` flag (threaded like `--interval-ms`), so a merely-slow-but-alive
 *        `clone say` is not mistaken for a genuine fault.
 *
 * .note = named in its own file (like DEFAULT_REMINDER_INTERVAL_MS) so both the cast
 *         (asRouteReminderSayTimeoutMs, for the absent-flag default) and sayToClone (the last-resort
 *         default when no timeout is threaded) read one source of truth, never a re-typed literal.
 */
export const DEFAULT_REMINDER_SAY_TIMEOUT_MS = 30 * 1000;
