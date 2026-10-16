import { asErrorHeadline } from '@src/domain.operations/review/asErrorHeadline';

import { asPartitionFaultClassHeader } from './asPartitionFaultClassHeader';
import { asPartitionFaultKind } from './asPartitionFaultKind';
import { asPartitionFaultRecoveryLines } from './asPartitionFaultRecoveryLines';

/**
 * .what = the one section that states a lane-wide refusal's cause and fix, ahead of every
 *         partition — or null where the lane's faults are not one lane-wide cause
 * .why = when every partition refused on the same constraint, the lane holds ONE cause and
 *        ONE fix. to print them under each partition makes a driver read N copies and wonder
 *        whether they differ; stated once, the cause reads as what it is
 * .note = this section raises no concern of its own: each partition still keeps its own
 *         `# blocker.1` section and counts as one blocker, since an unread verdict cannot be
 *         assumed clean (`contract.reviewer-output`). only the diagnosis moves here
 */
export const asPartitionFaultLaneSection = (input: {
  /** every fault of this lane's pour */
  faults: { error: unknown }[];
  /** how many partitions the lane poured */
  partitionsTotal: number;
  /** the route this run was driven from; null for a hand run */
  route: string | null;
}): string | null => {
  // no fault, no lane-wide cause
  const first = input.faults[0];
  if (!first) return null;

  // only a constraint every partition met verbatim is one lane-wide cause
  const kind = asPartitionFaultKind({
    error: first.error,
    faults: input.faults,
    partitionsTotal: input.partitionsTotal,
  });
  if (kind !== 'constraint.lane-wide') return null;

  // the cause and its fix, once
  return [
    '## lane: every partition refused',
    '',
    `${asPartitionFaultClassHeader({ kind })} every partition failed before it returned a verdict: ${asErrorHeadline({ error: first.error })}`,
    '',
    ...asPartitionFaultRecoveryLines({
      kind,
      error: first.error,
      route: input.route,
    }),
    '',
  ].join('\n');
};
