/**
 * .what = checks if a slug is invalid against a list of valid slugs
 * .why = provides named validation for self-review slug constraints
 */
export const isInvalidSelfReviewSlug = (input: {
  slug: string;
  validSlugs: string[];
}): boolean => {
  // if no valid slugs defined, any slug is valid
  if (input.validSlugs.length === 0) return false;

  // check if slug is in the valid list
  return !input.validSlugs.includes(input.slug);
};
