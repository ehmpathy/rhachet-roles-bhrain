/**
 * .what = computes articulation file path for self-review
 * .why = single source of truth for path format, enables consistent file location
 */
export const getSelfReviewArticulationPath = (input: {
  route: string;
  stone: string;
  index: number;
  slug: string;
}): string =>
  `${input.route}/review/self/${input.stone}.${input.index}.${input.slug}.md`;
