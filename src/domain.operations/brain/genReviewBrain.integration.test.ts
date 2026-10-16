import { BadRequestError, getError } from 'helpful-errors';
import { given, then, useThen, when } from 'test-fns';

import { genReviewBrain } from './genReviewBrain';

/**
 * .what = clamps the one review-brain boot
 * .why = 🔴 four sites booted the review brain by hand, and they had drifted: one named an
 *        unregistered brain by its PINNED slug, another by the raw choice, so two refusals
 *        named two slugs for one fault. the op owns the fault name now, and this proves it
 *
 * .note = the lookup fails in package discovery, before any provider call, so it spends naught
 */
describe('genReviewBrain', () => {
  given('[case1] a pinned slug that no brains package registers', () => {
    when('[t0] the brain is booted', () => {
      const result = useThen('the boot fails', async () => ({
        error: await getError(
          genReviewBrain({ choice: 'nowhere/glm/flash/v0' }),
        ),
      }));

      then('🔴 it refuses as a constraint, never a raw lookup stack', () => {
        expect(result.error).toBeInstanceOf(BadRequestError);
        expect(result.error.constructor.name).toEqual('ConstraintError');
      });

      then('🔴 the refusal names the pinned slug', () => {
        expect(result.error.message).toContain(
          "brain 'nowhere/glm/flash/v0' is not registered",
        );
      });
    });
  });
});
