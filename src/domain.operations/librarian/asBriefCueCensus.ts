import { asBriefLinesByCue } from '../learn/asBriefLinesByCue';

/**
 * .what = the chars a set of lines costs, each with its newline
 */
const asCharsOfLines = (input: { lines: string[] }): number =>
  input.lines.reduce((sum, line) => sum + line.length + 1, 0);

/**
 * .what = the cue share of one brief: the chars of its CUE lines and of its ARGUMENT lines
 * .why = `rule.prefer.rules-that-refout` says a rule keeps its cue at say and refs out its
 *        argument. a boot budget set without that split is a guess at how far a cue-only
 *        rewrite can shrink a min, and `cueLines` lets a census taken before a rewrite be
 *        diffed against one taken after, so a dropped line is named
 *
 * .note = the cut is `asBriefLinesByCue`, a line heuristic, so `cueChars` is a FLOOR on what
 *         must stay and never a proof that a cut is safe
 */
export const asBriefCueCensus = (input: {
  text: string;
}): { cueChars: number; argChars: number; cueLines: string[] } => {
  const sorted = asBriefLinesByCue({ text: input.text });
  return {
    cueChars: asCharsOfLines({ lines: sorted.cueLines }),
    argChars: asCharsOfLines({ lines: sorted.argLines }),
    cueLines: sorted.cueLines,
  };
};
