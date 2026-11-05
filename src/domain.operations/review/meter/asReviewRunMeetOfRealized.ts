import {
  isReviewRunMeet,
  type ReviewRunMeet,
} from '@src/domain.objects/Reviewer/ReviewRunMeet';

/**
 * .what = what a run's level meet did, as its realized record holds it
 * .why = one read for every reader of the record, so the run, the lane fold, and the pair
 *        cannot read one run's meet two ways
 *
 * .note = null where the record is absent or predates the field, or names a value no writer
 *         sends — an unknown meet grades as no meet, never as a warm one
 */
export const asReviewRunMeetOfRealized = (input: {
  realized: Record<string, unknown> | null;
}): ReviewRunMeet | null => {
  const meet = input.realized?.meet;
  if (typeof meet !== 'string') return null;
  const candidate = { meet };
  return isReviewRunMeet(candidate) ? candidate.meet : null;
};
