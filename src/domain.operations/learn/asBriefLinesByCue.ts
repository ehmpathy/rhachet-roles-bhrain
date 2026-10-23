/**
 * .what = sort the nonblank lines of a brief into CUE and ARGUMENT, in order
 * .why  = one source of truth for what a cue is, for the reports that rank briefs by it
 *         (`rhx census.cues`, `rhx brief.min.moveout`). the clamp snapshot pins every line, never
 *         this cut, since a markup heuristic cannot see a cue written as prose
 * .note = per `rule.prefer.rules-that-refout`: cue = a table row · a blockquote · a bullet · a
 *         header · an enforcement line · a line inside a fence. argument = each other line. it is
 *         a markup heuristic, so a one-line claim written as plain prose counts as argument: the
 *         cue share it reports is a FLOOR on what must stay, never a proof that a cut is safe
 */
export const asBriefLinesByCue = (input: {
  text: string;
}): { cueLines: string[]; argLines: string[] } => {
  const sorted = input.text
    .split('\n')
    .filter((line) => line.trim() !== '')
    .reduce<{ inFence: boolean; cueLines: string[]; argLines: string[] }>(
      (acc, line) => {
        // a fence mark is itself a cue, and flips the fence state for the lines after it
        const isFence = isFenceMark({ line });
        const isCue = isFence || isCueLine({ line, inFence: acc.inFence });
        return {
          inFence: isFence ? !acc.inFence : acc.inFence,
          cueLines: isCue ? [...acc.cueLines, line] : acc.cueLines,
          argLines: isCue ? acc.argLines : [...acc.argLines, line],
        };
      },
      { inFence: false, cueLines: [], argLines: [] },
    );
  return { cueLines: sorted.cueLines, argLines: sorted.argLines };
};

/**
 * .what = whether one line opens or closes a fence
 * .why  = a fence holds a shape or a demo, and every line inside it is a cue
 */
export const isFenceMark = (input: { line: string }): boolean =>
  /^\s*```/.test(input.line);

/**
 * .what = whether one line is a cue, given whether it sits inside a fence
 * .why  = the markup a when-row, a test, or an enforcement line is written in
 */
const isCueLine = (input: { line: string; inFence: boolean }): boolean =>
  /^\s*\|/.test(input.line) || // a table row
  /^\s*>/.test(input.line) || // a blockquote
  /^\s*([-*]|\d+\.)\s/.test(input.line) || // a bullet
  /^\s*#/.test(input.line) || // a header, 👎/👍 headers among them
  /^\s*(blocker|nitpick|false positive|not a violation)\s*:/i.test(
    input.line,
  ) || // an enforcement line
  /^\s*test\s*:/i.test(input.line) || // a test line, the question a reader asks of a case
  input.inFence; // a fenced shape or demo
