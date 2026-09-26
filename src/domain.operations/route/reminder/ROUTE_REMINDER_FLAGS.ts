/**
 * .what = the canonical CLI flag names of the RouteReminder shell surface, one source of truth
 * .why = the flag names are BOTH produced and consumed, in two files that must agree exactly:
 *        - getRouteReminderDaemonSpawnPlan builds the argv a spawned daemon inherits (the producer)
 *        - route.reminder.ts parses those same flags off argv (the consumer)
 *        hand-typed in both, a rename drifts silently at typecheck and only fails loud at runtime
 *        (a `BadRequestError` when the consumer cannot find the renamed key). one shared const ties
 *        producer to consumer, so a rename is a single edit the compiler propagates, never a
 *        two-place drift (rule.require.ubiqlang — one canonical token per concept).
 *
 * .note = values are the bare flag names (no `--` prefix); the producer prepends `--` when it
 *         builds argv, the consumer keys its parsed options bag by the bare name. one shape serves
 *         both without either re-computing the other's form.
 */
export const ROUTE_REMINDER_FLAGS = {
  route: 'route',
  cloneAddr: 'clone-addr',
  intervalMs: 'interval-ms',
  sayTimeoutMs: 'say-timeout-ms',
} as const;
