import type { StepReviewInput } from '@src/domain.operations/review/StepReviewInput';

/**
 * .what = whether a run asks for a `--mode plan` preview with no partition declared at all
 * .why = a plan previews a split, so a plan with no declaration — no `--partition` flag, no
 *        route set — has naught to preview, and that is knowable from the flags alone, before
 *        any side effect (a log dir, a token artifact) is made
 *
 * .note = a partition run (`partition` set) is a single partition of a split, never a plan
 */
export const isReviewPlanWithoutDeclaration = (input: {
  review: Pick<
    StepReviewInput,
    'mode' | 'partition' | 'partitions' | 'partitionsOfRoute'
  >;
}): boolean =>
  input.review.mode === 'plan' &&
  !input.review.partition &&
  (input.review.partitions ?? []).length === 0 &&
  (input.review.partitionsOfRoute?.partition ?? []).length === 0;
