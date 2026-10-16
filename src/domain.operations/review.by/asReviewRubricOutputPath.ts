import * as path from 'path';

/**
 * .what = the path one rubric's review output lands at, within a review.by output dir
 * .why = the run that writes it and the settle that names it on a fault must agree on one
 *        path, so the join lives in one named transformer rather than two inline templates
 */
export const asReviewRubricOutputPath = (input: {
  outputDir: string;
  slug: string;
}): string => path.join(input.outputDir, `rubric=${input.slug}.md`);
