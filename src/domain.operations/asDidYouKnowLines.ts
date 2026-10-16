/**
 * .what = the header every next-move hint block opens with
 * .why = one phrase everywhere, so a reader's eye finds the move at a glance. ✨ is this
 *        repo's hint glyph; the turtle repos print 🥥 for the same block
 *        (rule.require.coconut-hints, ehmpathy/rhachet-roles-ehmpathy)
 */
export const HEADER_OF_DID_YOU_KNOW = '✨ did you know?';

/**
 * .what = a next-move hint, rendered as its own block: a blank line, the header, then
 *         treestruct rows
 * .why = a hint is optional guidance, so it sits apart from the tree that holds the verdict.
 *        an inline `tip:` or `hint:` row mixed the move into the diagnosis, and its colon read
 *        as a key with a value (rule.require.coconut-hints). a separate block also keeps it out
 *        of any text above it that a driver copies
 *
 * .note = the last row is the one a reader acts on, so a row that names a command goes last
 */
export const asDidYouKnowLines = (input: { rows: string[] }): string[] => {
  // no row, no block: an empty header would promise a move it does not name
  if (input.rows.length === 0) return [];
  return [
    '',
    HEADER_OF_DID_YOU_KNOW,
    ...input.rows.map(
      (row, index) =>
        `   ${index === input.rows.length - 1 ? '└─' : '├─'} ${row}`,
    ),
  ];
};
