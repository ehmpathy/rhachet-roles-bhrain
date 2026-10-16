import { MalfunctionError } from 'helpful-errors';

import { asTimeoutHuman } from './asTimeoutHuman';

/**
 * .what = error thrown when review times out
 * .why = a timeout is a server-side malfunction, not a caller fault
 *
 * .note = extends MalfunctionError, so it maps to exit 1, distinct from the
 *         caller-fault ConstraintError (exit 2). helpful-errors writes the header
 *         into the message itself, from the class's own name, so the message
 *         passed here is bare — a hand-written header would print twice
 */
export class ReviewTimeoutError extends MalfunctionError {
  constructor(input: { timeoutMs: number }) {
    super(`review timed out after ${asTimeoutHuman({ ms: input.timeoutMs })}`, {
      timeoutMs: input.timeoutMs,
      hint: 'raise RHACHET_REVIEW_TIMEOUT_MS to extend it. under a guard or review.by, the brain call is bound a tenth (at most one minute) below the value you set, so this figure may read below it',
    });
    this.name = 'ReviewTimeoutError';
  }
}

// the header a human reads is the qualified class, `💥 MalfunctionError:`
// (rule.require.qualified-error-headers). helpful-errors names the header after
// the constructor, so the constructor answers to that name; `instanceof` and the
// instance's own `name` still say ReviewTimeoutError
Object.defineProperty(ReviewTimeoutError, 'name', {
  value: 'MalfunctionError',
});
