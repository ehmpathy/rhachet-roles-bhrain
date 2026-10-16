import { BadRequestError } from 'helpful-errors';

/**
 * .what = the refusal a review throws once its owl frame is already on stderr
 * .why = a refusal site emits its whole frame (`emitReviewRefusal`) — headline, detail
 *        tree, fix — and then throws so the run halts. the cli's catch must not print
 *        the thrown message again under a second `✋ ConstraintError:` header, or a
 *        driver reads one failure twice and the second copy names no fix. the catch
 *        narrows on this TYPE to exit 2 in silence, never on a message
 *
 * .note = extends BadRequestError, so it stays a caller-fault constraint (exit 2), and
 *         every extant `instanceof BadRequestError` check — a partition fault section,
 *         an sdk caller — reads it unchanged, message and all
 */
export class ReviewRefusalEmittedError extends BadRequestError {
  constructor(message: string) {
    super(message);
    this.name = 'ReviewRefusalEmittedError';
  }
}

// helpful-errors names the message header after the constructor, so the constructor answers
// to its parent's name and the header an sdk caller reads is unchanged by the narrower type;
// `instanceof` and the instance's own `name` still say ReviewRefusalEmittedError
Object.defineProperty(ReviewRefusalEmittedError, 'name', {
  value: 'BadRequestError',
});
