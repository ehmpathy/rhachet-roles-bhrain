import { asCountedNoun } from '@src/utils/asCountedNoun';

import { asReviewPartitionCountsLabel } from './asReviewPartitionCountsLabel';
import type { ReviewPartitionOfTargets } from './getAllTargetsByPartition';

/**
 * .what = the lines that announce an overflowed scope's split into its declared partitions
 * .why = a human reads this on stderr before the partition runs begin, so each partition
 *        names its narrow and common counts — the two figures that decide whether it fits —
 *        through the one counts label the route trees read too
 *
 * .note = 🔴 `primed` is named only where a prime runs: the prime writes the prefix EVERY
 *         partition carries (`getAllTargetsCommonToEvery`), and an empty one runs no prime
 *         (`setOneReviewPartitionsPrime`). a headline that claimed `primed` there would
 *         report an act that never happened (rule.forbid.surprises)
 */
export const asReviewPartitionSplitLines = (input: {
  partitions: Pick<ReviewPartitionOfTargets, 'name' | 'narrow' | 'common'>[];
  /** the targets every partition carries — the prefix the prime writes, or `[]` for none */
  commonToEvery: string[];
}): string[] => [
  `🔍 the whole scope overflows — split into ${asCountedNoun({ count: input.partitions.length, one: 'declared partition', many: 'declared partitions' })}, ${input.commonToEvery.length > 0 ? 'primed, then poured at once' : 'poured at once (no file is common to every partition, so no prime)'}`,
  ...input.partitions.map(
    (partition, index) =>
      `   ${index === input.partitions.length - 1 ? '└─' : '├─'} ${asReviewPartitionCountsLabel({ partition })}`,
  ),
  '',
];
