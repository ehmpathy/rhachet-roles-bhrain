import type { StepReviewResult } from '@src/domain.operations/review/StepReviewResult';

import { asReviewPartitionPlanLines } from './asReviewPartitionPlanLines';
import { asReviewResultOfPlan } from './asReviewResultOfPlan';
import type { emitReviewPartitionSplitVerdict } from './emitReviewPartitionSplitVerdict';
import { refuseReviewPlanWithoutSplit } from './refuseReviewPlanWithoutSplit';

/**
 * .what = the `--mode plan` path of a review run — prints the declared split, calls no brain
 * .why = a plan previews what a declaration would send, before any brain is called (seed S44).
 *        its own step, so the review orchestrator reads "plan, or compile and ask" rather
 *        than a branch to simulate
 *
 * .note = a plan with no declared split is a constraint: it is refused on stderr and thrown
 *         as a `ReviewRefusalEmittedError`, so the cli does not print the frame twice
 */
export const stepReviewPlanOfSplit = (input: {
  /** the checked split, as `emitReviewPartitionSplitVerdict` hands it back; null for none */
  splitChecked: ReturnType<typeof emitReviewPartitionSplitVerdict>;
  /** the route the run was driven from, whose spec glob is never flagged; null for none */
  route: string | null;
  logDir: string;
  output: string;
}): StepReviewResult => {
  // a plan previews a split, so no declared split leaves naught to preview
  if (!input.splitChecked) return refuseReviewPlanWithoutSplit();

  // print the plan of the split, and return it at zero cost
  const planLines = asReviewPartitionPlanLines({
    split: input.splitChecked.split,
    costs: input.splitChecked.costs,
    route: input.route,
  });
  console.log(planLines.join('\n'));
  return asReviewResultOfPlan({
    formatted: planLines.join('\n'),
    logDir: input.logDir,
    output: input.output,
  });
};
