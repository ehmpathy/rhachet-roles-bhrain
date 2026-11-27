/**
 * .what = the slugs given, less every slug in `without`, in their given order
 * .why = the suite asks one question in three places — which plotted courses have not exited,
 *        which stones have not passed — and each answer keeps the order of the first list
 */
export const asSlugsWithout = (input: {
  slugs: string[];
  without: string[];
}): string[] => {
  const excluded = new Set(input.without);
  return input.slugs.filter((slug) => !excluded.has(slug));
};
