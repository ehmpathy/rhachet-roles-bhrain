import { ROUTE_REMINDER_FLAGS } from './ROUTE_REMINDER_FLAGS';

/**
 * .what = the argv + node eval a detached RouteReminder daemon process is launched from
 * .why = names the spawn command so the host communicator reads as narrative and so the exact
 *        launch shape is unit-testable without a real process. the daemon runs the package's
 *        `route.reminder` cli subpath (an isolated, brain-free export — no heavy imports at
 *        startup, rule.require.isolated-cli-subpath-exports), exactly as the shell skills do.
 *
 * .note = `process.execPath` (the node binary) is the command; the eval imports the cli subpath
 *         and calls `routeReminderDaemon`, then `--` passes the daemon its args. the posix `--`
 *         end-of-options marker matches how every bhrain shell skill invokes the cli.
 *
 * .note = the flag NAMES come from ROUTE_REMINDER_FLAGS (the single source of truth this producer
 *         shares with the route.reminder consumer). the producer prepends `--`; a rename is then one
 *         edit the compiler propagates to both sides, never a two-place drift (rule.require.ubiqlang).
 */
export const getRouteReminderDaemonSpawnPlan = (input: {
  nodePath: string;
  route: string;
  cloneAddr: string;
  intervalMs: number;
  sayTimeoutMs: number;
}): { command: string; args: string[] } => ({
  command: input.nodePath,
  args: [
    '-e',
    "import('rhachet-roles-bhrain/cli/route.reminder').then(m => m.routeReminderDaemon())",
    '--',
    `--${ROUTE_REMINDER_FLAGS.route}`,
    input.route,
    `--${ROUTE_REMINDER_FLAGS.cloneAddr}`,
    input.cloneAddr,
    `--${ROUTE_REMINDER_FLAGS.intervalMs}`,
    String(input.intervalMs),
    `--${ROUTE_REMINDER_FLAGS.sayTimeoutMs}`,
    String(input.sayTimeoutMs),
  ],
});
