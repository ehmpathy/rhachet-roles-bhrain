/**
 * .what = the dir name of a pursuit route
 * .why = the inverse of asPursuitRouteParts; one shape for the write and the read
 */
export const asPursuitRouteName = (input: {
  date: string;
  role: string;
  slug: string;
}): string => `v${input.date}.education.pursuit.${input.role}.${input.slug}`;
