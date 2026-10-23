import type { StepReviewInput } from '@src/domain.operations/review/StepReviewInput';
import type { StepReviewResult } from '@src/domain.operations/review/StepReviewResult';

/**
 * .what = the step one partition run (or the prime) is handed to
 * .why = named once, so the split orchestrator and each of its leaves share one shape
 * .note = the step carries its own brain: the caller closes over its context, so the split
 *         reaches no external boundary and keeps the two-arg shape
 *         (rule.require.input-context-pattern, rule.require.input-options-pattern)
 */
export type ReviewPartitionRunStep = (
  input: StepReviewInput,
) => Promise<StepReviewResult>;
