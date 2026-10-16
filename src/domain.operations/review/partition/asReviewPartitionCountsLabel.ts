import { asCountedNoun } from '@src/utils/asCountedNoun';

import type { ReviewPartitionOfTargets } from './getAllTargetsByPartition';

/**
 * .what = the counts label of one partition: `<slug>: N narrow targets + M common targets`
 * .why = the overflow split, the route partition tree, and the coverage read all name a
 *        partition by its counts. the words live here once, so a reword lands on every
 *        surface at once (rule.forbid.duplicate-format-tree-operations)
 *
 * .note = label only, never branch chars nor indent — each caller owns its tree shape
 */
export const asReviewPartitionCountsLabel = (input: {
  partition: Pick<ReviewPartitionOfTargets, 'name' | 'narrow' | 'common'>;
}): string =>
  `${input.partition.name}: ${asCountedNoun({ count: input.partition.narrow.length, one: 'narrow target', many: 'narrow targets' })} + ${asCountedNoun({ count: input.partition.common.length, one: 'common target', many: 'common targets' })}`;
