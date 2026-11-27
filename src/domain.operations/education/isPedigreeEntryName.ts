/**
 * .what = whether a file name is a pedigree entry (`pedigree.pursuit=…md`), never the index
 * .why = one home for the entry name test; the read, the stamp, and the judge share it
 */
export const isPedigreeEntryName = (input: { name: string }): boolean =>
  input.name.startsWith('pedigree.pursuit=') && input.name.endsWith('.md');
