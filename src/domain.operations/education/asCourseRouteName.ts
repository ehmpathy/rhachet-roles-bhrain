/**
 * .what = the dir name of a course route
 * .why = the inverse of asCourseRouteParts; one shape for the write and the read
 */
export const asCourseRouteName = (input: {
  ordinal: number;
  slug: string;
}): string => `course=${input.ordinal}.${input.slug}`;
