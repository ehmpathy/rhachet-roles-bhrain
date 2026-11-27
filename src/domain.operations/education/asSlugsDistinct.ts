/**
 * .what = the slugs given, each once, in name order
 * .why = a role may be found by two routes (published here, linked back); a list a director
 *        reads names it once
 */
export const asSlugsDistinct = (input: { slugs: string[] }): string[] =>
  [...new Set(input.slugs)].sort();
