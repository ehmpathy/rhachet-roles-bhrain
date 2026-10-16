import type { StepReviewResult } from '@src/domain.operations/review/StepReviewResult';

/**
 * .what = the pour's settled outcomes, each run's value unwrapped, beside every fault a
 *         partition retry swallowed on the way to it
 * .why = a run that answered on its retry still left a first attempt whose spend is
 *        unreported; that fault must reach the lane's spend decision, while the verdict
 *        alone reaches the merge. behind a name, so the orchestrator reads "split the pour"
 *        (rule.forbid.decode-friction-in-orchestrators)
 */
export const asPartitionPourOfSettled = (input: {
  settled: PromiseSettledResult<{
    value: StepReviewResult;
    faults: { error: unknown }[];
  }>[];
}): {
  settled: PromiseSettledResult<StepReviewResult>[];
  faultsSwallowed: { error: unknown }[];
} => ({
  settled: input.settled.map(
    (outcome): PromiseSettledResult<StepReviewResult> =>
      outcome.status === 'fulfilled'
        ? { status: 'fulfilled', value: outcome.value.value }
        : outcome,
  ),
  faultsSwallowed: input.settled.flatMap((outcome) =>
    outcome.status === 'fulfilled' ? outcome.value.faults : [],
  ),
});
