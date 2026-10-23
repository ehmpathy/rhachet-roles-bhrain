import type { ReviewPartitionOfTargets } from './getAllTargetsByPartition';

/**
 * .what = the other partitions of a split, by slug and declared globs
 * .why = a partition run must name where the rest of its lane sits, so its reviewer never
 *        reads a file outside its own slice as a file absent from the branch
 * .note = only the partitions that run are peers — one that grades naught is never run, so
 *         it reviews naught a reader could be sent to
 */
export const getAllPartitionPeersOf = (input: {
  partition: Pick<ReviewPartitionOfTargets, 'name'>;
  partitions: Pick<ReviewPartitionOfTargets, 'name' | 'globs'>[];
}): Pick<ReviewPartitionOfTargets, 'name' | 'globs'>[] =>
  input.partitions
    .filter((peer) => peer.name !== input.partition.name)
    .map((peer) => ({ name: peer.name, globs: peer.globs }));
