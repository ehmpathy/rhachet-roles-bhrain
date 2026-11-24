import * as fs from 'fs/promises';
import * as path from 'path';
import { types } from 'util';

import { withEnoentAsNull } from '../withEnoentAsNull';
import { asRouteReminderHandleStem } from './asRouteReminderHandleStem';
import { delRouteReminderPidHandleIfPidAt } from './delRouteReminderPidHandleIfPidAt';
import { getAllRouteDirsOfRepo } from './getAllRouteDirsOfRepo';
import { isExpectedLegacyReapFault } from './isExpectedLegacyReapFault';
import { isProcessAlive } from './isProcessAlive';
import { readRouteReminderRawPidAtOrFault } from './readRouteReminderRawPidAtOrFault';
import { stopProcess } from './stopProcess';

/**
 * .what = the result of one legacy handle reap
 * .why = a caller reports a reap, surfaces a kept handle with its pid, and skips an absent one
 */
export type RouteReminderLegacyReapOutcome =
  | { kind: 'absent' }
  | { kind: 'reaped'; pid: number; pidPath: string; signalled: boolean }
  | { kind: 'kept'; pid: number | null; pidPath: string; error: Error };

/**
 * .what = reaps this clone's legacy per-route RouteReminder handles — the daemons spawned before the
 *         handle moved to the clone home
 * .why = a daemon spawned before one-per-clone holds a handle at `$route/.route/daemon.of=…pid`, one
 *        per route the clone drove. left alone, each keeps its own nudge cadence beside the new clone
 *        daemon — the exact two-nudges-per-interval defect this fix exists to end. so the findsert
 *        (genRouteReminder) calls this before it spawns, and the `route.reminder.del` cli calls it
 *        beside its clone teardown; after one spawn, one daemon remains. a drive's reap arm never
 *        calls it: a legacy daemon on a dead route exits through its own doors
 *
 * .note = removal condition: delete this sweep, its callers' calls, and getAllRouteDirsOfRepo once no
 *         supported version of this package spawns a per-route daemon, and every clone has spawned
 *         once since its upgrade
 *
 * .note = it writes no log. it returns each outcome, and the caller picks the channel: the findsert
 *         writes them to the clone log (setRouteReminderLegacyReapLog); the `del` cli hands them to
 *         the human on stdout, so a deliberate `del` leaves no clone log for `get` to misread as a crash
 *
 * .note = the reach is `<repoRoot>/{.behavior,.route}/<route>/.route/` at depth one — literal
 *         segments, never a recursive glob (rule.forbid.unbounded-recursive-globs). a legacy route
 *         kept elsewhere falls back to its daemon's own exit doors (route-not-live, session-dead)
 *
 * .note = each handle is its own unit of work: an EXPECTED fault on one (an EPERM signal, a torn pid
 *         file, an io fault on its dir) keeps that handle as a `kept` outcome, and the sweep moves on.
 *         any other fault class rethrows, since it is a defect, not a stuck handle (rule.forbid.failhide)
 *
 * .note = the pid is the identity, as it is for the clone handle: a legacy pid file whose pid was
 *         recycled to a foreign process of this user is signalled. the reach is bounded to two
 *         moments: a spawn (genRouteReminder runs the sweep only when no clone daemon answers) and a
 *         human's explicit `route.reminder.del`. a stale file is met at most once per such moment,
 *         never once per drive; after its first reap it is gone. a pre-fix daemon never dropped its
 *         own pid file, so a dead-pid legacy file is common; it is cleared with `signalled: false`
 *
 * .note = idempotent: a second sweep finds no handle and does naught
 */
export const delRouteReminderLegacyHandles = async (input: {
  repoRoot: string;
  cloneAddr: string;
}): Promise<{ outcomes: RouteReminderLegacyReapOutcome[] }> => {
  // the routes this repo holds, and the legacy handle stem this clone wrote into each
  const routeDirs = await getAllRouteDirsOfRepo({ repoRoot: input.repoRoot });
  const stem = asRouteReminderHandleStem({ cloneAddr: input.cloneAddr });

  // reap each route's handle on its own; an expected fault keeps that handle, the rest go on
  const outcomes = await Promise.all(
    routeDirs.map((routeDir) => delOneLegacyHandle({ routeDir, stem })),
  );
  return { outcomes };
};

/**
 * .what = reaps one legacy handle: signal its live daemon, then compare-and-delete its files
 * .why = the same teardown shape as delRouteReminder, at a legacy path. the compare-and-delete keeps
 *        a handle a concurrent writer replaced; the log and crash files go with the pid, since no
 *        reader looks for them at the legacy path any more
 *
 * .note = an expected fault (isExpectedLegacyReapFault) returns `kept`, with the pid where one was
 *         read; any other fault rethrows
 */
const delOneLegacyHandle = async (input: {
  routeDir: string;
  stem: string;
}): Promise<RouteReminderLegacyReapOutcome> => {
  const handleDir = path.join(input.routeDir, '.route');
  const pidPath = path.join(handleDir, `${input.stem}.pid`);

  // read the pid the handle names; a torn file or an unreadable dir keeps the handle
  const read = await readRouteReminderRawPidAtOrFault({ pidPath });
  if ('fault' in read)
    return asKeptOrRethrow({ pid: null, pidPath, error: read.fault });

  // no legacy handle here → naught to reap
  if (read.named === null) return { kind: 'absent' };
  const pid = read.named.pid;

  // tell a live legacy daemon to stop, then remove the handle only if it still names that pid,
  // then its log and crash files. `signalled` tells a stopped daemon from a stale file: a pre-fix
  // daemon never dropped its own pid file, so a dead-pid file is common on upgrade day
  try {
    const signalled = isProcessAlive({ pid })
      ? stopProcess({ pid, signal: 'SIGTERM' }).stopped
      : false;
    const { removed } = await delRouteReminderPidHandleIfPidAt({
      pidPath,
      pid,
    });
    if (!removed) return { kind: 'absent' };
    await delLegacyAuxFiles({ handleDir, stem: input.stem });
    return { kind: 'reaped', pid, pidPath, signalled };
  } catch (error: unknown) {
    return asKeptOrRethrow({ pid, pidPath, error });
  }
};

/**
 * .what = removes a legacy handle's log and crash files, if present
 * .why = no reader looks for them at the legacy path once the pid is gone; an absent file is fine
 */
const delLegacyAuxFiles = async (input: {
  handleDir: string;
  stem: string;
}): Promise<void> => {
  for (const suffix of ['log', 'crashes'])
    await withEnoentAsNull(() =>
      fs.rm(path.join(input.handleDir, `${input.stem}.${suffix}`)),
    );
};

/**
 * .what = a `kept` outcome for an expected reap fault; a rethrow for any other
 * .why = one allowlist decides which faults keep a handle and which fail loud (rule.forbid.failhide)
 */
const asKeptOrRethrow = (input: {
  pid: number | null;
  pidPath: string;
  error: unknown;
}): RouteReminderLegacyReapOutcome => {
  // isNativeError, never `instanceof Error`: a node fs error from another vm realm fails `instanceof`
  if (!types.isNativeError(input.error)) throw input.error;
  if (!isExpectedLegacyReapFault({ error: input.error })) throw input.error;
  return {
    kind: 'kept',
    pid: input.pid,
    pidPath: input.pidPath,
    error: input.error,
  };
};
