import { FULCRUM_FRONTMATTER_BLOCK_PATTERN } from './asFulcrumFrontmatter';

/**
 * .what = a fulcrum's content with `status: ruled` and the human verdict written into its
 *         frontmatter, every other line byte-identical — or null when the file holds no block
 * .why = the lever touches two fields and no more. a yaml re-dump would drop the driver's
 *        comments and reorder keys; a line edit keeps each line the human read where it was
 *
 * .note = the verdict replaces the `verdict:` line and every indented line beneath it, so a
 *         prior verdict (a re-rule) is replaced, never doubled. the date is written bare; the
 *         parser reads a bare and a quoted date as one day
 */
export const asFulcrumContentWithVerdict = (input: {
  content: string;
  ruled: 'upheld' | 'conceded';
  on: string;
}): string | null => {
  // the block, and where its body sits in the content
  const match = input.content.match(FULCRUM_FRONTMATTER_BLOCK_PATTERN);
  if (!match?.[1]) return null;
  const start = match[0].indexOf(match[1]);

  // rewrite the two fields line by line
  const lines = asFrontmatterLinesWithVerdict({
    lines: match[1].split(/\r?\n/),
    ruled: input.ruled,
    on: input.on,
  });
  return [
    input.content.slice(0, start),
    lines.join('\n'),
    input.content.slice(start + match[1].length),
  ].join('');
};

/**
 * .what = the block's lines, with the `status:` line set to ruled and the `verdict:` key (with
 *         its indented children) replaced by the verdict map
 * .why = a pure fold over lines, so no loop mutates a list in place
 */
const asFrontmatterLinesWithVerdict = (input: {
  lines: string[];
  ruled: 'upheld' | 'conceded';
  on: string;
}): string[] =>
  input.lines.reduce<{ lines: string[]; isUnderVerdict: boolean }>(
    (fold, line) => {
      // a line indented beneath the old verdict key belongs to the old verdict; drop it
      if (fold.isUnderVerdict && /^\s+\S/.test(line)) return fold;
      if (/^status\s*:/.test(line))
        return {
          lines: [...fold.lines, 'status: ruled'],
          isUnderVerdict: false,
        };
      if (/^verdict\s*:/.test(line))
        return {
          lines: [
            ...fold.lines,
            'verdict:',
            '  by: human',
            `  at: ${input.on}`,
            `  ruled: ${input.ruled}`,
          ],
          isUnderVerdict: true,
        };
      return { lines: [...fold.lines, line], isUnderVerdict: false };
    },
    { lines: [], isUnderVerdict: false },
  ).lines;
