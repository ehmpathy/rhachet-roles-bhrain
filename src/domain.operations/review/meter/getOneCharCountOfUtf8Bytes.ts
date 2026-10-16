/**
 * .what = how many chars a run of utf-8 bytes holds, counted as a js string counts them
 * .why = a shared prefix is measured in BYTES, since a prompt cache keys on bytes, while
 *        every other figure the meter states about a prompt is in CHARS — the compiled
 *        census, the static head. to set a byte count beside a char count would compare
 *        two units, so the prefix is restated in the unit its peers carry
 *
 * .note = counted as utf-16 code units, the unit `string.length` reports: a lead byte of
 *         a four-byte sequence (an emoji) counts two, every other lead byte counts one,
 *         and a continuation byte counts none. a sequence cut short at the end of the run
 *         still counts its lead byte, so a prefix that parts mid-glyph counts that glyph
 */
export const getOneCharCountOfUtf8Bytes = (input: {
  bytes: Uint8Array;
}): number =>
  input.bytes.reduce((sum, byte) => sum + asCharUnitsOfLeadByte({ byte }), 0);

/**
 * .what = the utf-16 code units one utf-8 byte opens
 * .why = the per-byte rule the count above sums, named so the sum reads plainly
 */
const asCharUnitsOfLeadByte = (input: { byte: number }): number => {
  // a continuation byte (10xxxxxx) opens no char of its own
  if ((input.byte & 0xc0) === 0x80) return 0;

  // a four-byte lead (11110xxx) opens a char past the basic plane, two code units
  if (input.byte >= 0xf0) return 2;

  // every other lead opens one code unit
  return 1;
};
