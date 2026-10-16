import type { ReviewPartitionOfTargets } from './getAllTargetsByPartition';

/**
 * .what = the partitions that grade at least one file
 * .why = a partition whose every file is graded elsewhere — no narrow target, no common file
 *        assigned to it — would pay for a prompt that grades naught, so it is not run
 */
export const getAllPartitionsThatGrade = (input: {
  partitions: ReviewPartitionOfTargets[];
}): ReviewPartitionOfTargets[] =>
  input.partitions.filter(
    (partition) =>
      partition.narrow.length > 0 || partition.commonGraded.length > 0,
  );
