import { asGlobList } from '@src/domain.operations/review/asGlobList';

/**
 * .what = whether a review names any supply at all — a rule, a diff range, or a path
 * .why = a review with none of the three has naught to grade, and must refuse
 *        before it resolves a scope
 */
export const isReviewSupplyAsked = (input: {
  rules: string | string[] | undefined;
  diffs: string | undefined;
  paths: string | string[] | undefined;
}): boolean =>
  asGlobList({ of: input.rules }).length > 0 ||
  !!input.diffs ||
  asGlobList({ of: input.paths }).length > 0;
