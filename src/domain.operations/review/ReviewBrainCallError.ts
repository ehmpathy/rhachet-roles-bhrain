import { MalfunctionError } from 'helpful-errors';

import { asErrorMessage } from '@src/domain.operations/review/asErrorMessage';

/**
 * .what = error thrown when the brain call itself fails — a provider outage, a
 *         dropped socket, a malformed response
 * .why = a provider fault is a server-side malfunction, the timeout's peer. unwrapped,
 *        it reached the driver as a bare stack with no `💥` header and no next step
 *        (rule.require.qualified-error-headers)
 *
 * .note = the cause's own message rides in the headline, so the provider's words (a
 *         `503`, a `412`) stay the first words a driver reads after the header
 * .note = helpful-errors writes the header into the message itself, from the class's
 *         own name, so the message passed here is bare — the same convention as
 *         ReviewTimeoutError. a hand-written header would print twice
 */
export class ReviewBrainCallError extends MalfunctionError {
  constructor(input: { error: unknown }) {
    const cause = asErrorMessage({ error: input.error });
    super(`the brain call failed — ${cause}`, {
      hint: 're-run the review; if it persists, check the provider status and its credentials',
      cause: input.error instanceof Error ? input.error : undefined,
    });
    this.name = 'ReviewBrainCallError';
  }
}

// the header a human reads is the qualified class, `💥 MalfunctionError:`
// (rule.require.qualified-error-headers). helpful-errors names the header after
// the constructor, so the constructor answers to that name; `instanceof` and the
// instance's own `name` still say ReviewBrainCallError
Object.defineProperty(ReviewBrainCallError, 'name', {
  value: 'MalfunctionError',
});
