/**
 * .what = the canonical CLI flag names of the RouteReminder shell surface, one source of truth
 * .why = the flag names are BOTH produced and consumed, in two files that must agree exactly:
 *        - getRouteReminderDaemonSpawnPlan builds the argv a spawned daemon inherits (the producer)
 *        - route.reminder.ts parses those same flags off argv (the consumer)
 *        one shared const ties producer to consumer, so a rename is a single edit the compiler
 *        propagates, never a two-place drift (rule.require.ubiqlang).
 *
 * .note = values are the bare flag names (no `--` prefix); the producer prepends `--` when it
 *         builds argv, the consumer keys its parsed options bag by the bare name.
 *
 * .note = `repoRoot` is the daemon's anchor: the dir its clone handle and focus live under. the
 *         daemon takes no `--route` — it reads the route from the focus, each tick.
 */
export const ROUTE_REMINDER_FLAGS = {
  route: 'route',
  repoRoot: 'repo-root',
  cloneAddr: 'clone-addr',
  intervalMs: 'interval-ms',
  sayTimeoutMs: 'say-timeout-ms',
} as const;
