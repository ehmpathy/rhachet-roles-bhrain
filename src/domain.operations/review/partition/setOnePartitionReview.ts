import type { ReviewLaneClock } from '@src/domain.objects/Reviewer/ReviewLaneClock';
import type { StepReviewInput } from '@src/domain.operations/review/StepReviewInput';
import type { StepReviewResult } from '@src/domain.operations/review/StepReviewResult';

import { asReviewPartitionOutputPath } from './asReviewPartitionOutputPath';
import type { ReviewPartitionOfTargets } from './getAllTargetsByPartition';
import type { ReviewPartitionRunStep } from './ReviewPartitionRunStep';
import { withOneRetryOnBrainCallFault } from './withOneRetryOnBrainCallFault';

/**
 * .what = runs ONE partition: the whole review input, scoped to its partition, written to
 *         its own numbered output, with one retry on a brain call fault while the lane's
 *         bound has time left
 * .why = the pour's per-partition shape has one home, so the orchestrator reads as
 *        `partitions.map(setOnePartitionReview)` rather than a lambda to simulate
 * .note = `set`, never `get`: it makes a billed brain call and writes the run and its
 *         partition report to disk (rule.require.get-set-gen-verbs)
 */
export const setOnePartitionReview = (
  input: {
    review: StepReviewInput;
    partition: ReviewPartitionOfTargets;
    /** the other partitions of the split, so the prompt can name where the rest of the lane sits */
    peers: Pick<ReviewPartitionOfTargets, 'name' | 'globs'>[];
    index: number;
    /** the lane's one clock, which the retry reads before it re-asks */
    clock: ReviewLaneClock;
  },
  options: { runOne: ReviewPartitionRunStep },
): Promise<{ value: StepReviewResult; faults: { error: unknown }[] }> =>
  withOneRetryOnBrainCallFault({
    name: input.partition.name,
    clock: input.clock,
    operation: () =>
      options.runOne({
        ...input.review,
        output: asReviewPartitionOutputPath({
          output: input.review.output,
          of: { name: input.partition.name, index: input.index },
        }),
        partition: input.partition,
        peers: input.peers,
      }),
  });
