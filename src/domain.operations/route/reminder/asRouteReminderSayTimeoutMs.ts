import {
  asStrictBoundedPositiveInteger,
  MS_SETTIMEOUT_MAX,
} from './asStrictBoundedPositiveInteger';
import { DEFAULT_REMINDER_SAY_TIMEOUT_MS } from './DEFAULT_REMINDER_SAY_TIMEOUT_MS';

/**
 * .what = casts a raw `--say-timeout-ms` flag value into a validated positive-integer timeout
 * .why = the daemon's `rhx clone say` inject is bounded so a hung call cannot wedge the tick. the
 *        bound is 30s by default, but an operator on a slow/loaded machine needs a knob to widen it
 *        — else a merely-slow-but-alive `clone say` hits the same crash-loud wall as a dead session.
 *        this cast threads that knob the SAME way asRouteReminderIntervalMs threads `--interval-ms`:
 *        both compose the shared asStrictBoundedPositiveInteger (one strict-parse + floor +
 *        setTimeout-cap guard), so neither re-rolls the parse (rule.prefer.most-common-denominator);
 *        this wrapper supplies only the timeout's own flag name, subject noun, example, default, and floor.
 *
 * an ABSENT flag resolves to the default (30s); a MALFORMED / out-of-range flag throws a
 * BadRequestError that names the fix (exit 2, a caller constraint — rule.require.errors-name-the-fix).
 *
 * .note = MIN 1000 ms — a sub-second timeout would cancel almost every real `clone say` mid-flight
 *         (the call answers in ms normally, but a loaded machine can take longer), which defeats the
 *         knob's purpose.
 */
export const asRouteReminderSayTimeoutMs = (input: {
  raw: string | undefined;
}): number =>
  asStrictBoundedPositiveInteger({
    raw: input.raw,
    flag: '--say-timeout-ms',
    subject: 'bound',
    example: '30000',
    defaultMs: DEFAULT_REMINDER_SAY_TIMEOUT_MS,
    min: 1_000, // 1s — the sane floor for an inject-call bound
    max: MS_SETTIMEOUT_MAX,
  });
