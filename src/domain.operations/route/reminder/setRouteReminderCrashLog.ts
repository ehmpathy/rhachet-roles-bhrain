import * as fs from 'fs/promises';
import * as path from 'path';

import { withEnoentAsNull } from '../withEnoentAsNull';
import { claimExclusiveWrite } from './claimExclusiveWrite';
import { getRouteReminderCrashLogPath } from './getRouteReminderCrashLogPath';

// the crash-log filename shape, as a matcher — the ONE place that parses the index back out, twin of
// getRouteReminderCrashLogPath's format (the writer). a filename that does not match is ignored, so
// an unrelated file dropped in `.malfunctions/` never corrupts the next-index compute.
const CRASH_LOG_INDEX_PATTERN = /^daemon\.driveon\._\.crash\.n(\d+)\.log$/;

/**
 * .what = atomically claims one crash-log slot — writes the record `wx` (create-exclusive) at the
 *         given index, and on a lost race (EEXIST) recurses to the next index until it wins.
 * .why = the index claim must be race-safe: two daemons on one route that self-exit near-together
 *        both compute the same fast-path index, so a plain writeFile would let the second silently
 *        overwrite the first's audit record. `wx` makes the filesystem elect one winner per slot;
 *        the loser retries the next slot (rule.forbid.behavior-hazards — no unguarded
 *        read-modify-write). any other write fault surfaces (rule.forbid.failhide).
 */
const claimCrashLogSlot = async (input: {
  route: string;
  index: number;
  body: string;
}): Promise<{ path: string; index: number }> => {
  const crashLogPath = getRouteReminderCrashLogPath({
    route: input.route,
    index: input.index,
  });

  // claim this index slot atomically via the shared `wx` primitive (twin of setRouteReminderPidHandle)
  const { claimed } = await claimExclusiveWrite({
    path: crashLogPath,
    body: input.body,
  });

  // a lost race (claimed:false) means a concurrent crash already took this slot → try the next
  // index (never overwrite the earlier audit record)
  if (!claimed) return claimCrashLogSlot({ ...input, index: input.index + 1 });
  return { path: crashLogPath, index: input.index };
};

/**
 * .what = writes an observable RouteReminder malfunction crash record when the daemon self-exits on
 *         a failed reach (the first-fail session-dead door), at the next free index in the route's
 *         `.malfunctions/` dir.
 * .why = the wisher accepted the first-fail self-exit (it keeps U3's hard no-clog guarantee), on the
 *        condition that the exit is NOT silent (vision, settled 2026-09-06). a transient blip that
 *        ends the reminder is indistinguishable at the exit from a true session-end, so this leaves a
 *        durable, discoverable trace a human can find — never a quiet death (rule.require.status-feedback,
 *        rule.forbid.failhide).
 *
 * .note = INTENTIONAL append-only audit record — the ONE sanctioned exception to
 *         rule.forbid.nonidempotent-mutations (an audit-log append is intrinsically non-idempotent).
 *         a monotonic index (n0, n1, …) is claimed per crash so a later crash never overwrites an
 *         earlier record. the claim is ATOMIC: each slot is written `wx` (create-exclusive), so when
 *         two daemons on one route self-exit near-simultaneously the filesystem elects ONE winner per
 *         index and the loser retries at the next free slot — never a silent overwrite of the very
 *         audit record the wisher required (rule.forbid.behavior-hazards — no unguarded
 *         read-modify-write; mirrors setRouteReminderPidHandle's `wx` claim). the readdir max+1 is
 *         only the fast-path first guess, not the authority — the `wx` write is. no wall-clock time
 *         is stored (rule.forbid.timestamps-in-route-artifacts); the file's own mtime carries "when",
 *         the index carries order.
 *
 * .note = the session that crashed is named by its cloneAddr in the CONTENT, not the path — the crash
 *         dir is route-level (one history per route), so the content names which session died.
 */
export const setRouteReminderCrashLog = async (input: {
  route: string;
  cloneAddr: string;
  reason: string;
  ticks: number;
}): Promise<{ path: string; index: number }> => {
  const dir = path.dirname(
    getRouteReminderCrashLogPath({ route: input.route, index: 0 }),
  );

  // read the extant crash records to compute the next free index. an ABSENT dir (ENOENT) is the
  // first-ever crash → index 0; any other errno is a real fault that surfaces (rule.forbid.failhide).
  const names = (await withEnoentAsNull(() => fs.readdir(dir))) ?? [];
  const priorIndices = names
    .map((name) => CRASH_LOG_INDEX_PATTERN.exec(name)?.[1])
    .filter((match): match is string => match !== undefined)
    .map((digits) => Number.parseInt(digits, 10));
  const indexGuess =
    priorIndices.length === 0 ? 0 : Math.max(...priorIndices) + 1;

  const body = [
    `RouteReminder daemon crash — reason=${input.reason}`,
    `route:  ${input.route}`,
    `clone:  ${input.cloneAddr}`,
    `ticks:  ${input.ticks}`,
    'detail: the daemon could not reach the driver session (clone say reach-state gate), so it',
    '        self-exited on the first failed reach — the U3 no-clog guarantee (no retry, no',
    '        infiniloop). if this was a transient blip rather than a true session-end, route.drive',
    '        re-findserts a fresh daemon on the next live drive while the route stays live.',
    '',
  ].join('\n');

  // create the dir if absent (recursive = idempotent), then claim a slot atomically from the
  // fast-path guess — `wx` elects one winner per index, a lost race retries the next slot
  await fs.mkdir(dir, { recursive: true });
  return claimCrashLogSlot({ route: input.route, index: indexGuess, body });
};
