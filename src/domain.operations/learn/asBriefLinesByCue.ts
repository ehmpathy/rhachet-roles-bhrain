import { asLinesWithFenceState } from './asLinesWithFenceState';

/**
 * .what = sort the nonblank lines of a brief into CUE and ARGUMENT, in order
 * .why  = one source of truth for what a cue is, for the reports that rank briefs by it
 *         (the librarian's `asBriefCueCensus` and `asMinWithWhySectionsMoved`, behind
 *         `rhx census.cues` and `rhx brief.min.moveout`). the clamp snapshot pins every line, never
 *         this cut, since a markup heuristic cannot see a cue written as prose
 * .note = per `rule.prefer.rules-that-refout`: cue = a table row · a blockquote · a bullet · a
 *         header · an enforcement line · a line inside a fence. argument = each other line. it is
 *         a markup heuristic, so a one-line claim written as plain prose counts as argument: the
 *         cue share it reports is a FLOOR on what must stay, never a proof that a cut is safe
 */
export const asBriefLinesByCue = (input: {
  text: string;
}): { cueLines: string[]; argLines: string[] } => {
  // a fence mark is itself a cue, and so is each line inside a fence
  const entries = asLinesWithFenceState({ text: input.text })
    .filter((entry) => entry.line.trim() !== '')
    .map((entry) => ({
      line: entry.line,
      isCue: entry.isFence || isCueLine(entry),
    }));
  return {
    cueLines: entries.filter((entry) => entry.isCue).map((entry) => entry.line),
    argLines: entries
      .filter((entry) => !entry.isCue)
      .map((entry) => entry.line),
  };
};

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
