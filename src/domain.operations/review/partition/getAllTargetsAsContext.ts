import type { ReviewPartitionOfTargets } from './getAllTargetsByPartition';

/**
 * .what = the common targets a partition READS as context and does not grade
 * .why = a common file is graded in exactly one partition (`commonGraded`); every other
 *        partition carries it so its prompt opens on the shared prefix, and the prompt must say
 *        it is context only, or the same file collects one verdict per partition
 *
 * .note = no partition → `undefined`: a whole run grades every target it carries
 */
export const getAllTargetsAsContext = (input: {
  partition:
    | Pick<ReviewPartitionOfTargets, 'common' | 'commonGraded'>
    | undefined;
}): string[] | undefined => {
  // a whole run reads naught as context only
  if (!input.partition) return undefined;

  // the common files this partition carries but another partition grades
  const graded = new Set(input.partition.commonGraded);
  return input.partition.common.filter((path) => !graded.has(path));
};
