/**
 * .what = parts a helpful-errors message into its human headline and its metadata bag
 * .why = helpful-errors appends `\n\n` + the metadata as pretty json to `.message`. a refusal
 *        a human reads wants the headline and, at most, the `hint`; the raw bag is debug
 *        noise in that frame (rule.forbid.snapshot-visual-blemishes). one parser, so each
 *        render seam drops the bag the same way rather than each with its own regex
 *
 * .note = the bag is recognized only when the tail after the last blank line parses as a
 *         json object. any other tail stays in the headline, so a message whose shape is
 *         unknown is never cut short (rule.forbid.failhide)
 */
export const asHelpfulMessageParts = (input: {
  message: string;
}): {
  headline: string;
  metadata: Record<string, unknown> | null;
  hint: string | null;
} => {
  // the bag opens on its own line, after a blank one
  const at = input.message.lastIndexOf('\n\n{');
  if (at < 0) return { headline: input.message, metadata: null, hint: null };

  // only a tail that parses as a json object is the bag
  const metadata = asJsonObjectOrNull({ text: input.message.slice(at + 2) });
  if (!metadata) return { headline: input.message, metadata: null, hint: null };

  return {
    headline: input.message.slice(0, at).trimEnd(),
    metadata,
    hint: typeof metadata.hint === 'string' ? metadata.hint : null,
  };
};

/**
 * .what = the text as a json object, or null when it is not one
 * .why = the bag test needs a yes/no, and a parse failure is that no — never a fault
 */
const asJsonObjectOrNull = (input: {
  text: string;
}): Record<string, unknown> | null => {
  try {
    const parsed: unknown = JSON.parse(input.text);
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed))
      return null;
    return Object.fromEntries(Object.entries(parsed));
  } catch (error) {
    // allowlist the one expected fault: the tail is not json, so it is no bag
    if (error instanceof SyntaxError) return null;
    throw error;
  }
};
