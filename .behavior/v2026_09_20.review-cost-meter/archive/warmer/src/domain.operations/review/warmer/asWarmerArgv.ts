import type { ReviewWarmerPlan } from './asReviewWarmerPlan';
import { FLAG_OF_WARMER_ARG } from './FLAG_OF_WARMER_ARG';

/**
 * .what = the argv a warmer child is spawned with, from the settled plan
 * .why = the write half of the warmer argv contract; `asWarmerArgsFromArgv` is the read
 */
export const asWarmerArgv = (input: {
  reviewer: string;
  logDir: string;
  plan: ReviewWarmerPlan;
  brain: string;
}): string[] => [
  FLAG_OF_WARMER_ARG.reviewer,
  input.reviewer,
  FLAG_OF_WARMER_ARG.logDir,
  input.logDir,
  FLAG_OF_WARMER_ARG.pokes,
  String(input.plan.pokes),
  FLAG_OF_WARMER_ARG.every,
  String(input.plan.everyMinutes),
  FLAG_OF_WARMER_ARG.brain,
  input.brain,
];
