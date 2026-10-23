import { asCountHuman } from '@src/domain.operations/review/asCountHuman';

import type { ReviewPartitionSplit } from './getAllTargetsByPartition';

/**
 * .what = the unclaimed label of a split: `unclaimed: N`
 * .why = the review plan, the route partition tree, and the coverage read all close on this
 *        count. the words live here once (rule.forbid.duplicate-format-tree-operations)
 *
 * .note = label only, never branch chars nor indent — each caller owns its tree shape
 */
export const asReviewPartitionUnclaimedLabel = (input: {
  split: Pick<ReviewPartitionSplit, 'unclaimed'>;
}): string =>
  `unclaimed: ${asCountHuman({ of: input.split.unclaimed.length })}`;
