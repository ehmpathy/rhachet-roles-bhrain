import { asBriefLinesByCue } from '../learn/asBriefLinesByCue';
import { asLinesWithFenceState } from '../learn/asLinesWithFenceState';

/**
 * .what = whether a line opens a `.why` section: a level-2 header that names `.why`, or the
 *         peer `.the two arguments`
 */
const isWhyHeader = (input: { line: string }): boolean =>
  /^## .*(\.why\b|\.the two arguments)/.test(input.line);

/**
 * .what = whether a line ends a section: any level-1 or level-2 header
 */
const isSectionEnd = (input: { line: string }): boolean =>
  /^#{1,2} /.test(input.line);

/**
 * .what = each why-section of a min, as the half-open line range it spans
 * .why = a header inside a fence never opens or ends a section, so each line is marked with
 *        its fence state first (a fence mark counts as inside)
 */
const getAllWhySectionRanges = (input: {
  text: string;
}): { from: number; to: number }[] => {
  const marked = asLinesWithFenceState({ text: input.text }).map((entry) => ({
    line: entry.line,
    fenced: entry.inFence || entry.isFence,
  }));
  const split = marked.reduce<{
    open: number | null;
    sections: { from: number; to: number }[];
  }>(
    (acc, entry, index) => {
      // a why header opens a section, and closes one that was open
      if (!entry.fenced && isWhyHeader({ line: entry.line }))
        return {
          open: index,
          sections:
            acc.open === null
              ? acc.sections
              : [...acc.sections, { from: acc.open, to: index }],
        };

      // a section header closes the open one
      if (acc.open !== null && !entry.fenced && isSectionEnd(entry))
        return {
          open: null,
          sections: [...acc.sections, { from: acc.open, to: index }],
        };
      return acc;
    },
    { open: null, sections: [] },
  );

  // a section left open runs to the end of the text
  return split.open === null
    ? split.sections
    : [...split.sections, { from: split.open, to: marked.length }];
};

/**
 * .what = why a section must stay in the min, or null where it may move
 * .why = a move deletes text, so it is safe only where the `.md` already holds every line. a
 *        section with a cue line stays, since a cue is read at the act; a section with a body
 *        line the `.md` lacks stays, since it may have no home there
 */
const getReasonSectionHeld = (input: {
  body: string[];
  mdLines: Set<string>;
}): string | null => {
  const cueLines = asBriefLinesByCue({ text: input.body.join('\n') }).cueLines;
  if (cueLines.length > 0) return 'a cue line';
  const absent = input.body
    .map((line) => line.trim())
    .filter((line) => line !== '' && !input.mdLines.has(line));
  if (absent.length > 0)
    return `${absent.length} body line(s) absent from the .md`;
  return null;
};

/**
 * .what = move the argument-only `## .why…` sections out of one min, to the `.md` beside it
 * .why = `rule.prefer.rules-that-refout` says a rule boots its cue and refs out its argument,
 *        and a `.why` section is the case FOR a cue, read once, by a reader who disputes it. a
 *        min that keeps one pays it on every boot. by hand, the move across many mins drops a
 *        cue or misses a section; one walk names each section it moves
 *
 * .note = a section is HELD, never cut, if it holds any cue line (the one shared classifier,
 *         `asBriefLinesByCue`) or any body line the `.md` lacks verbatim after trim. a `#`
 *         inside a fence never ends a section. `textNext` is the min with the moved ranges
 *         dropped and all else where it sat; it equals `minText` where no section moved
 */
export const asMinWithWhySectionsMoved = (input: {
  minText: string;
  mdText: string;
}): {
  sectionsMoved: { header: string; lineCount: number }[];
  sectionsHeld: { header: string; reason: string }[];
  textNext: string;
} => {
  const lines = input.minText.split('\n');
  const mdLines = new Set(input.mdText.split('\n').map((line) => line.trim()));

  // judge each section: held with a reason, or free to move
  const judged = getAllWhySectionRanges({ text: input.minText }).map(
    (range) => ({
      ...range,
      header: lines[range.from]!,
      reason: getReasonSectionHeld({
        body: lines.slice(range.from + 1, range.to),
        mdLines,
      }),
    }),
  );
  const moved = judged.filter((section) => section.reason === null);
  const held = judged.filter((section) => section.reason !== null);

  // rebuild the min: drop the moved ranges, keep all else where it sat
  const dropped = new Set(
    moved.flatMap((section) =>
      Array.from(
        { length: section.to - section.from },
        (_, offset) => section.from + offset,
      ),
    ),
  );
  return {
    sectionsMoved: moved.map((section) => ({
      header: section.header,
      lineCount: section.to - section.from,
    })),
    sectionsHeld: held.map((section) => ({
      header: section.header,
      reason: section.reason!,
    })),
    textNext:
      moved.length === 0
        ? input.minText
        : lines.filter((_, index) => !dropped.has(index)).join('\n'),
  };
};
