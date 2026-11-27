/**
 * .what = the file name of one pedigree entry: `pedigree.pursuit=v$date.$slug.md`
 * .why = itemized by coordinate, beside its `pedigree._.md` root
 */
export const asPedigreeEntryName = (input: {
  date: string;
  slug: string;
}): string => `pedigree.pursuit=v${input.date}.${input.slug}.md`;
