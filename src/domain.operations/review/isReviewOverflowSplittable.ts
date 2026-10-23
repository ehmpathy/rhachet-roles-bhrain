/**
 * .what = whether an overflowed review splits into its declared partitions, rather than refuse
 * .why = three facts decide it — the run overflowed, the caller declared at least one
 *        partition, and the run is the WHOLE run, never a partition already. a partition
 *        that overflows refuses with the lever to declare a narrower one; it never splits
 *        a second time (F91). named, so `stepReview` reads split-or-refuse as one act
 */
export const isReviewOverflowSplittable = (input: {
  overflowed: boolean;
  partitionsDeclared: number;
  isPartitionRun: boolean;
}): boolean =>
  input.overflowed && input.partitionsDeclared > 0 && !input.isPartitionRun;
