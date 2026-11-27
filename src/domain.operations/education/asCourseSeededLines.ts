/**
 * .what = the courses a pursuit seeds, one ordinal line each, in plot order: `1. idempotency`
 * .why = the wish the route writes and the stdout the face prints show the same list, so the
 *        render lives once; each caller states its own words for an empty plot
 */
export const asCourseSeededLines = (input: { courses: string[] }): string[] =>
  input.courses.map((course, index) => `${index + 1}. ${course}`);
