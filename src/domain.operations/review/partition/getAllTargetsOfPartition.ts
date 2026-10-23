import { UnexpectedCodePathError } from 'helpful-errors';

import type { ReviewPartitionOfTargets } from './getAllTargetsByPartition';

/**
 * .what = the targets one partition run carries — its `common` targets FIRST, widest share
 *         first, then its `narrow` ones in the order the whole run asked for them
 * .why = 🔴 bytes are ordered by how many requests send them, widest share first
 *        (`rule.require.order-prompt-bytes-by-reuse-breadth`). the targets every partition
 *        carries lead every prompt byte for byte, so the prime writes them once and each
 *        partition reads them from cache. a narrow target ahead of them would part the
 *        shared prefix at its own first byte (`rule.forbid.shared-bytes-behind-narrow-bytes`)
 *
 * .note = the common order is the split's (`getAllTargetsByPartition`), which sorts by breadth
 *         and keeps the run's cache-stability order within a breadth. it is never re-sorted
 *         here, or two partitions could order the same shared files two ways
 * .note = 🔴 every planned target MUST sit in the scope given. the split was planned over that
 *         same settled scope, so a planned target absent from it is a defect in our own code —
 *         and to drop it silently would let the merged report claim a file graded that no
 *         reviewer saw (rule.forbid.failhide). so it throws, never filters
 */
export const getAllTargetsOfPartition = (input: {
  targets: string[];
  partition: Pick<
    ReviewPartitionOfTargets,
    'name' | 'common' | 'narrow'
  > | null;
}): string[] => {
  // a whole run has no peers to share with, so its order stands
  if (!input.partition) return input.targets;

  // every planned target must be in the scope the plan was made over
  const extant = new Set(input.targets);
  const absent = [...input.partition.common, ...input.partition.narrow].filter(
    (target) => !extant.has(target),
  );
  if (absent.length > 0)
    throw new UnexpectedCodePathError(
      'a partition plans a target its settled scope does not hold',
      { partition: input.partition.name, absent },
    );

  // common leads, in the split's order, then this partition's narrow targets
  const common = new Set(input.partition.common);
  const narrow = new Set(input.partition.narrow);
  return [
    ...input.partition.common,
    ...input.targets.filter(
      (target) => narrow.has(target) && !common.has(target),
    ),
  ];
};
