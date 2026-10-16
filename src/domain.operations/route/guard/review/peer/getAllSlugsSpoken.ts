import { compareStrings } from '@src/utils/compareStrings';

/**
 * .what = the distinct reviewer slugs that spoke in a set of givens, in code-unit order
 * .why = the "valid options" a caller lists must be stable per machine, never in glob order,
 *        which is the filesystem's (rule.forbid.order-dependence)
 */
export const getAllSlugsSpoken = (input: {
  givens: { slug: string }[];
}): string[] =>
  [...new Set(input.givens.map((given) => given.slug))].sort(compareStrings);
