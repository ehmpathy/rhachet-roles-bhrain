/**
 * .what = the default RouteReminder cadence — ~20 minutes, per the wish's own example
 * .why = a hardcoded cadence is a needless constraint; a configurable one with a sane default
 *        is the clean rework (vision Q2). 20min matches the wish; a caller may override.
 *
 * .note = its own file, beside the peer reminder constants (REMINDER_NUDGE_PROSE), so both
 *         the orchestrator (genRouteReminder) and the transformer (asRouteReminderIntervalMs)
 *         import the value from one canonical home — not the transformer from the orchestrator.
 */
export const DEFAULT_REMINDER_INTERVAL_MS = 20 * 60 * 1000;
