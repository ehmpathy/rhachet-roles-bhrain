import type { ReviewRunArgsRecord } from '@src/domain.objects/Reviewer/ReviewRunArgsRecord';
import type { StepReviewInput } from '@src/domain.operations/review/StepReviewInput';

/**
 * .what = the args a run records — the lane's, with this run's own output and partition
 * .why = the scope walk records the lane's invocation once; a partition run writes to its own
 *        numbered output and reviews its own partition, so its record states those two
 */
export const asReviewRunArgsOfRun = (input: {
  args: ReviewRunArgsRecord['args'];
  review: Pick<StepReviewInput, 'output' | 'partition'>;
}): ReviewRunArgsRecord['args'] => ({
  ...input.args,
  output: input.review.output,
  partition: input.review.partition?.name ?? null,
});
