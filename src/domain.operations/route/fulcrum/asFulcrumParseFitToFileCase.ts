import type { FulcrumFrontmatterParse } from './asFulcrumFrontmatter';

/**
 * .what = a frontmatter parse, read as invalid when its `case` differs from the file's case id
 * .why = the halt prints the frontmatter case, the summary and the path carry the file id, and the
 *        verdict lever keys its ledger row on one of them. two ids for one entry let a human rule
 *        one and the gate read the other, so the entry is unreadable until they agree
 */
export const asFulcrumParseFitToFileCase = (input: {
  parse: FulcrumFrontmatterParse;
  slug: string;
}): FulcrumFrontmatterParse => {
  // only a valid parse carries a case to compare
  if (input.parse.kind !== 'valid') return input.parse;
  if (input.parse.frontmatter.case === input.slug) return input.parse;

  // the case disagrees with the file id: name the one value it must take
  return {
    kind: 'invalid',
    absent: [],
    malformed: [`case (equal to the file id, ${input.slug})`],
  };
};
