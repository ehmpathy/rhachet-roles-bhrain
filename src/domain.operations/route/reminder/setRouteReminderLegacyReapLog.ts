import { asRouteReminderLegacyReapLines } from './asRouteReminderLegacyReapLines';
import type { RouteReminderLegacyReapOutcome } from './delRouteReminderLegacyHandles';
import { setRouteReminderLogLine } from './setRouteReminderLogLine';
import { surfaceRouteReminderFault } from './surfaceRouteReminderFault';
import { withToleratedIoFaultAsValue } from './withToleratedIoFaultAsValue';

/**
 * .what = writes each legacy reap outcome to the clone log of the clone the sweep ran for
 * .why = a human who wonders where an old daemon went, or why one is left, reads it there. the line
 *        lands in the OPERATED clone's log (input.cloneAddr), never the env-derived one, so a sweep
 *        for another clone reports to that clone
 *
 * .note = a tolerated io fault on a log write is surfaced (surfaceRouteReminderFault), never a reason
 *         to undo the reap; any other fault rethrows (rule.forbid.failhide)
 */
export const setRouteReminderLegacyReapLog = async (input: {
  repoRoot: string;
  cloneAddr: string;
  outcomes: RouteReminderLegacyReapOutcome[];
}): Promise<void> => {
  for (const line of asRouteReminderLegacyReapLines({
    outcomes: input.outcomes,
  })) {
    const logFault = await withToleratedIoFaultAsValue(() =>
      setRouteReminderLogLine({
        repoRoot: input.repoRoot,
        cloneAddr: input.cloneAddr,
        line,
      }),
    );
    if (logFault)
      await surfaceRouteReminderFault({
        from: input.repoRoot,
        error: logFault,
      });
  }
};
