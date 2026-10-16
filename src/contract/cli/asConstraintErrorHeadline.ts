import type { BadRequestError } from 'helpful-errors';

/**
 * .what = the reason a caught caller-fix error carries, with its class lead stripped
 * .why = helpful-errors writes its own lead into `.message` — `BadRequestError: ` for the
 *        parent, `✋ ConstraintError: ` for the subclass. a refusal frame that writes its own
 *        qualified class (`emitReviewRefusal`, `asConstraintErrorHeader`) needs the bare
 *        reason, or the header would read twice
 *
 * .note = the strip binds to the message's LEAD only, so a class word inside the body or its
 *         metadata is left as written
 */
export const asConstraintErrorHeadline = (input: {
  error: BadRequestError;
}): string =>
  input.error.message.replace(/^(?:BadRequestError|✋ ConstraintError): /, '');
