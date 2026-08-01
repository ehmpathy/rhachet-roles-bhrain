import { BadRequestError } from 'helpful-errors';

import type { ReviewRubric } from './asReviewRubricsConfig';

/**
 * .what = narrows the rubric list to a single --for slug, or returns all when --for is absent
 * .why = the one place that maps the --for flag to a rubric subset. fails loud with a
 *        message that cites the fix when the slug is not among the declared rubrics.
 */
export const getAllReviewRubricsToRun = (input: {
  rubrics: ReviewRubric[];
  for: string | null;
}): ReviewRubric[] => {
  // no --for → run every rubric
  if (input.for === null) return input.rubrics;

  // --for → the one rubric whose slug matches, else fail loud
  const found = input.rubrics.find((rubric) => rubric.slug === input.for);
  if (found === undefined) {
    // name the valid slugs in the message itself so the human can pick one without a read
    // of rubrics.yml — an error that names the fix (rule.require.errors-name-the-fix)
    const available = input.rubrics.map((rubric) => rubric.slug);
    throw new BadRequestError(
      `rubric not found: ${input.for}. available rubrics: ${available.join(', ')}`,
      { for: input.for, available },
    );
  }
  return [found];
};
