import { asLinesWithFenceState } from './asLinesWithFenceState';

/**
 * .what = the headers of one text whose section holds no line, as `<file> :: <header>`
 * .why  = a header left over a section whose body moved to the `.md` is a title with naught
 *         under it; the clamp catches each one
 * .note = a header's section ends at the next header of the same or a shallower depth; a
 *         deeper header inside it is content. depth 1 is the title, never checked. a `#` inside
 *         a fence is a shell comment, never a header
 */
export const asHeadersOrphanedOfText = (input: {
  file: string;
  text: string;
}): string[] => {
  // mark each nonblank line with its header depth; null for prose and for any line in a fence
  const entries = asLinesWithFenceState({ text: input.text })
    .filter((entry) => entry.line.trim() !== '')
    .map((entry) => ({
      line: entry.line,
      depth:
        entry.inFence || entry.isFence
          ? null
          : asDepthOfHeader({ line: entry.line }),
    }));

  // an orphan is a header whose next line is a header at its own depth or shallower, or the end
  return entries
    .filter((entry, index) => {
      if (entry.depth === null || entry.depth < 2) return false;
      const next = entries[index + 1];
      if (next === undefined) return true;
      return next.depth !== null && next.depth <= entry.depth;
    })
    .map((entry) => `${input.file} :: ${entry.line.trim()}`);
};

/**
 * .what = the depth of a markdown header line, or null for a non-header
 * .why  = section bounds are set by depth
 */
const asDepthOfHeader = (input: { line: string }): number | null => {
  const match = input.line.match(/^(#{1,6}) /);
  return match ? match[1]!.length : null;
};
