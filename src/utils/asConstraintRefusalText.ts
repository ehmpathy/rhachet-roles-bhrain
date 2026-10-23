/**
 * .what = the text a cli prints for a caller-fixable refusal: one `✋` header that names its class
 * .why = a refusal may come from this repo's helpful-errors copy (`BadRequestError: …`) or a
 *        dependency's (`✋ ConstraintError: …`). each is rendered once, never double-prefixed, and
 *        a message that names no class gets `ConstraintError:` so the header always says who fixes
 *        it (rule.require.qualified-error-headers)
 */
export const asConstraintRefusalText = (input: { message: string }): string => {
  // already headed by the glyph and a class, as a foreign ConstraintError renders itself
  if (/^✋ \w+Error:/.test(input.message)) return input.message;

  // headed by a class alone, as this repo's BadRequestError renders itself
  if (/^\w+Error:/.test(input.message)) return `✋ ${input.message}`;

  // no class named: qualify it
  return `✋ ConstraintError: ${input.message.replace(/^✋\s*/, '')}`;
};
