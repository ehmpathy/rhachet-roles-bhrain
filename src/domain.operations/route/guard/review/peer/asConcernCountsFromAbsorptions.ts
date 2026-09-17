import { asReviewConcernRef } from './asReviewConcernRef';
import type { ReviewAbsorption } from './getStoneReviewAbsorptions';

/**
 * .what = folds a list of absorptions into per-severity concern counts (blockers, nitpicks)
 * .why = the disputed tally and the conceded-`better` tally both subtract from the judge's
 *        counts, and both reduce a filtered stance list the same way — one concern each, split
 *        by kind (S07). the fold is ONE operation, so the two subtractions cannot drift
 *        (rule.prefer.decomposable-architecture, rule-of-three).
 *
 * .note = the caller filters (disputed, or conceded-`better`) and this counts; the split keeps
 *         each subtraction's PREDICATE at its own call site and its ARITHMETIC here.
 */
export const asConcernCountsFromAbsorptions = (
  absorptions: ReviewAbsorption[],
): { blockers: number; nitpicks: number } =>
  absorptions.reduce(
    (acc, stance) => {
      const concern = asReviewConcernRef({ about: stance.about });
      return concern.kind === 'blocker'
        ? { ...acc, blockers: acc.blockers + 1 }
        : { ...acc, nitpicks: acc.nitpicks + 1 };
    },
    { blockers: 0, nitpicks: 0 },
  );
