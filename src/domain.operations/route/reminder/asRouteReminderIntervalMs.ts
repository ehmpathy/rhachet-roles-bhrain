import {
  asStrictBoundedPositiveInteger,
  MS_SETTIMEOUT_MAX,
} from './asStrictBoundedPositiveInteger';
import { DEFAULT_REMINDER_INTERVAL_MS } from './DEFAULT_REMINDER_INTERVAL_MS';

/**
 * .what = casts a raw `--interval-ms` flag value into a validated positive-integer cadence
 * .why = the shell surface takes the cadence as a raw string. a lenient `Number.parseInt` reads a
 *        numeric PREFIX and drops the rest, so `1200000abc` → 1200000 and `abc` → NaN pass a bare
 *        integer guard, and node SILENTLY clamps a value above its setTimeout cap to a ~1ms busy-loop
 *        — both the silent-continuation the failfast clause forbids (rule.require.failfast,
 *        rule.forbid.failhide). the strict-parse + floor + setTimeout-cap guard is the SHARED
 *        asStrictBoundedPositiveInteger (twin of asRouteReminderSayTimeoutMs); this wrapper supplies
 *        only the cadence's own flag name, subject noun, example, default, and floor.
 *
 * an ABSENT flag resolves to the default cadence; a MALFORMED / out-of-range flag throws a
 * BadRequestError that names the fix (exit 2, a caller constraint — rule.require.errors-name-the-fix).
 *
 * .note = MIN 1000 ms — a sub-second cadence is a self-inflicted DoS: at `--interval-ms 1` the daemon
 *         would spawn `rhx clone say` (a real subprocess) a thousand times a second at the driver's
 *         own session. a reminder is a periodic NUDGE (the default is 20 minutes), so no operator
 *         wants a sub-second cadence.
 */
export const asRouteReminderIntervalMs = (input: {
  raw: string | undefined;
}): number =>
  asStrictBoundedPositiveInteger({
    raw: input.raw,
    flag: '--interval-ms',
    subject: 'cadence',
    example: '1200000',
    defaultMs: DEFAULT_REMINDER_INTERVAL_MS,
    min: 1_000, // 1s — the sane floor for a periodic reminder nudge
    max: MS_SETTIMEOUT_MAX,
  });
