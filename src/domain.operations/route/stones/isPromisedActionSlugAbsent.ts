/**
 * .what = checks if a promised action lacks the required slug
 * .why = promised actions require a self-review slug via --that
 */
export const isPromisedActionSlugAbsent = (input: {
  action: string | undefined;
  slug: string | undefined;
}): boolean => {
  return input.action === 'promised' && !input.slug;
};
