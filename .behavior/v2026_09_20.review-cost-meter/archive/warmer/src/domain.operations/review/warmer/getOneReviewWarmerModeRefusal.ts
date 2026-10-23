import type { ReviewWarmerPlan } from './asReviewWarmerPlan';

/**
 * .what = the refusal for a warmer asked of a `--mode plan` run, or null
 * .why = a plan run previews a split and sends no prompt, so it ends `planned` and a
 *        warmer only spawns on a round that `reviewed`. a `--warmer on --mode plan` was
 *        parsed, validated, then ignored in silence — a spend the caller asked for and
 *        never got, with no word (rule.forbid.failhide)
 *
 * .note = a null plan is `--warmer off` or no `--warmer` at all, and asks for no warmer,
 *         so it is never refused
 */
export const getOneReviewWarmerModeRefusal = (input: {
  plan: ReviewWarmerPlan | null;
  mode: 'plan' | 'apply';
}): string | null => {
  // only a warmer that would spawn, on a run that sends no prompt, is refused
  if (input.plan === null) return null;
  if (input.mode !== 'plan') return null;

  return `--warmer ${input.plan.pokes}x,${input.plan.everyMinutes}m cannot run with --mode plan: a preview sends no prompt, so there is no cache to keep warm`;
};
