import type { ReviewPartitionOfTargets } from './getAllTargetsByPartition';

/**
 * .what = parts each partition's settled outcome into the verdicts obtained and the faults to name
 * .why = the pour settles every partition on its own; a fulfilled one keeps its verdict, a
 *        rejected one keeps its partition beside its error so the merged report can name it
 */
export const asPartitionOutcomesSplit = <T>(input: {
  runs: {
    partition: ReviewPartitionOfTargets;
    outcome: PromiseSettledResult<T>;
  }[];
}): {
  results: T[];
  faults: { partition: ReviewPartitionOfTargets; error: unknown }[];
} => ({
  results: input.runs.flatMap((run) =>
    run.outcome.status === 'fulfilled' ? [run.outcome.value] : [],
  ),
  faults: input.runs.flatMap(
    (run): { partition: ReviewPartitionOfTargets; error: unknown }[] =>
      run.outcome.status === 'rejected'
        ? [{ partition: run.partition, error: run.outcome.reason }]
        : [],
  ),
});
