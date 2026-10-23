import { ReviewRefusalEmittedError } from '@src/domain.operations/review/ReviewRefusalEmittedError';

/**
 * .what = the headline every overflow refusal prints, after `✋ ConstraintError: `
 * .why = a halt that reads a refused .given back must tell an overflow from every other
 *        refusal, since only an overflow is cured by a partition or a narrower bind. the
 *        writer and the reader share this one constant, so a reword cannot split them
 */
export const HEADLINE_OF_REVIEW_OVERFLOW =
  'prompt exceeds 75% of context window';

/**
 * .what = the refusal a review throws once its prompt overran the window
 * .why = a caller that must tell an overflow from any other refusal narrows on this TYPE,
 *        never on the message — a reword at the throw site must not void the narrow
 *        (the same reason `compileReviewPromptOrOverflow` narrows on its type)
 *
 * .note = extends ReviewRefusalEmittedError (itself a BadRequestError), so it stays a
 *         caller-fault constraint (exit 2), every extant `instanceof BadRequestError` check
 *         reads it unchanged, and the cli does not reprint the frame `emitReviewOverflowRefusal`
 *         already wrote
 */
export class ReviewOverflowRefusedError extends ReviewRefusalEmittedError {
  constructor() {
    super(HEADLINE_OF_REVIEW_OVERFLOW);
    this.name = 'ReviewOverflowRefusedError';
  }
}

// helpful-errors names the message header after the constructor, so the constructor answers
// to its parent's name and the header a human reads is unchanged by the narrower type;
// `instanceof` and the instance's own `name` still say ReviewOverflowRefusedError
Object.defineProperty(ReviewOverflowRefusedError, 'name', {
  value: 'BadRequestError',
});
