/**
 * .what = a refusal's message with the class lead helpful-errors writes cut off
 * .why = a halt or a lint renders the reason as a leaf under its own header, so the class word
 *        would read as a second header
 */
export const asFulcrumRefusalReason = (input: { message: string }): string =>
  input.message.replace(/^(?:BadRequestError|✋ ConstraintError): /, '');
