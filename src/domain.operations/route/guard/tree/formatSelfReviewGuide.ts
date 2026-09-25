import type { RouteStoneGuardReviewSelf } from '@src/domain.objects/Driver/RouteStoneGuard';

import { formatLetsReflect } from './formatLetsReflect';

/**
 * .what = renders the guide tail every self-review confrontation ends with
 * .why = all four verdicts close the same way — the guide, the owed path, the command —
 *        so one operation owns it and the four branches compose it
 *
 * .note = it renders NOTHING when no self review is in hand. a confrontation with no guide
 *         behind it is a refusal that names no fix, so the caller must supply one.
 */
export const formatSelfReviewGuide = (input: {
  stone: string;
  slug: string;
  route: string;
  selfReview?: {
    reviewSelf: RouteStoneGuardReviewSelf;
    index: number;
    total: number;
  };
}): string[] => {
  if (!input.selfReview) return [];

  return [
    formatLetsReflect({
      stone: input.stone,
      slug: input.slug,
      route: input.route,
      reviewSelf: input.selfReview.reviewSelf,
      index: input.selfReview.index,
      total: input.selfReview.total,
    }),
  ];
};
