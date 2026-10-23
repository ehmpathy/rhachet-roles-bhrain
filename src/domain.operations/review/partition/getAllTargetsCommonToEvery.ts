import type { ReviewPartitionOfTargets } from './getAllTargetsByPartition';

/**
 * .what = the common targets EVERY partition carries, in the first partition's order
 * .why = the prime writes the prefix every partition opens on; a file only some partitions
 *        carry is not a shared prefix, so to prime it buys no read for the rest
 *
 * .note = no partitions → no shared prefix
 */
export const getAllTargetsCommonToEvery = (input: {
  partitions: Pick<ReviewPartitionOfTargets, 'common'>[];
}): string[] =>
  (input.partitions[0]?.common ?? []).filter((path) =>
    input.partitions.every((partition) => partition.common.includes(path)),
  );
