import { UnexpectedCodePathError } from 'helpful-errors';

import type { ReviewPartitionOfTargets } from './getAllTargetsByPartition';

/**
 * .what = pairs each partition with the outcome its run settled to
 * .why = `Promise.allSettled` returns its outcomes in the order of the promises it was
 *        handed, so the pair is positional. the correspondence lives behind a name, and a
 *        count that disagrees fails loud rather than pair a partition with a hole
 *        (rule.forbid.decode-friction-in-orchestrators, rule.require.failfast)
 */
export const asPartitionRunsOfSettled = <T>(input: {
  partitions: ReviewPartitionOfTargets[];
  settled: PromiseSettledResult<T>[];
}): {
  partition: ReviewPartitionOfTargets;
  outcome: PromiseSettledResult<T>;
}[] => {
  // one outcome per partition, or the pour lost track of a run
  if (input.settled.length !== input.partitions.length)
    throw new UnexpectedCodePathError(
      'the pour settled a count of outcomes unlike its count of partitions',
      {
        partitions: input.partitions.length,
        settled: input.settled.length,
      },
    );

  // pair by position, the order allSettled preserves
  return input.partitions.map((partition, index) => ({
    partition,
    outcome: input.settled[index]!,
  }));
};
