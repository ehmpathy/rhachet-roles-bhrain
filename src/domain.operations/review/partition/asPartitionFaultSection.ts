import { asErrorHeadline } from '@src/domain.operations/review/asErrorHeadline';

import { asPartitionFaultClassHeader } from './asPartitionFaultClassHeader';
import { asPartitionFaultKind } from './asPartitionFaultKind';
import { asPartitionFaultRecoveryLines } from './asPartitionFaultRecoveryLines';

/**
 * .what = the section a failed partition leaves in the merged report
 * .why = the fault is the verdict this partition could give. it is named, counted as one
 *        blocker, and says how to recover, so a driver knows the gap and what closes it
 *
 * 🔴 .note = the recovery depends on the KIND of fault, and a re-run is the right advice for
 *         only one kind. a transient fault (a dropped socket, a timeout) clears on a re-run. a
 *         CONSTRAINT (an overflow, a bad input) is a refusal, and a re-run returns the same
 *         refusal — so to advise one sends the driver round a loop that cannot close
 *         (rule.require.errors-name-the-fix). a constraint names the fix its refusal names
 * 🔴 .note = when EVERY partition refused on the same constraint, the lane returned no verdict
 *         at all, and its one cause and one fix are stated ONCE, ahead of every partition
 *         (`asPartitionFaultLaneSection`). each partition's own section then points there,
 *         so the driver reads one cause for the whole lane rather than N copies of it
 */
export const asPartitionFaultSection = (input: {
  error: unknown;
  /** every fault of this lane's pour, this one among them */
  faults: { error: unknown }[];
  /** how many partitions the lane poured */
  partitionsTotal: number;
  /** the route this run was driven from; null for a hand run */
  route: string | null;
}): string => {
  const headline = asErrorHeadline({ error: input.error });
  const kind = asPartitionFaultKind({
    error: input.error,
    faults: input.faults,
    partitionsTotal: input.partitionsTotal,
  });
  const recovery =
    kind === 'constraint.lane-wide'
      ? [
          'this partition refused with the lane — the cause and its fix are stated once, above.',
        ]
      : asPartitionFaultRecoveryLines({
          kind,
          error: input.error,
          route: input.route,
        });
  return [
    '# blocker.1 — this partition did not review',
    '',
    `${asPartitionFaultClassHeader({ kind })} the partition failed before it returned a verdict: ${headline}`,
    '',
    'an unread verdict cannot be assumed clean, so it counts as one blocker.',
    ...recovery,
  ].join('\n');
};
