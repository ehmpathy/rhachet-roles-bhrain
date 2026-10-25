/**
 * .what = every line of a brief, in order, each marked with its fence state
 * .why  = one fold for the fence state, so every reader of brief lines agrees on which lines
 *         sit inside a fence (`asBriefLinesByCue`, `asHeadersOrphanedOfText`, and the librarian's
 *         `asMinWithWhySectionsMoved`, behind `rhx brief.min.moveout`)
 * .note = `isFence` marks a line that opens or closes a fence; `inFence` marks a line that sits
 *         between two such marks. a fence mark is never itself `inFence`. blank lines are kept, so
 *         an entry's index is its line's index in the text
 */
export const asLinesWithFenceState = (input: {
  text: string;
}): { line: string; isFence: boolean; inFence: boolean }[] =>
  input.text.split('\n').reduce<{
    inFence: boolean;
    out: { line: string; isFence: boolean; inFence: boolean }[];
  }>(
    (acc, line) => {
      // a fence mark flips the state for the lines after it
      const isFence = /^\s*```/.test(line);
      return {
        inFence: isFence ? !acc.inFence : acc.inFence,
        out: [...acc.out, { line, isFence, inFence: acc.inFence && !isFence }],
      };
    },
    { inFence: false, out: [] },
  ).out;
