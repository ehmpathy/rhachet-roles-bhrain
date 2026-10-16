import { BadRequestError } from 'helpful-errors';
import { given, then, when } from 'test-fns';

import { asReviewBrainCallFault } from './asReviewBrainCallFault';
import { ReviewBrainCallError } from './ReviewBrainCallError';

describe('asReviewBrainCallFault', () => {
  given('[case1] a caller fault', () => {
    const error = new BadRequestError('bad flag');

    when('[t0] it is classified', () => {
      then('the same error returns, so the cli exits 2', () => {
        expect(asReviewBrainCallFault({ error })).toBe(error);
      });
    });
  });

  given('[case2] a provider fault', () => {
    const error = new Error('Request timed out.');

    when('[t0] it is classified', () => {
      then('it wears the brain call malfunction class', () => {
        const fault = asReviewBrainCallFault({ error });
        expect(fault).toBeInstanceOf(ReviewBrainCallError);
        expect(fault.message).toContain('Request timed out.');
      });

      then('its header names the class once, never a doubled qualifier', () => {
        const fault = asReviewBrainCallFault({ error });
        expect(fault.message.split('\n')[0]).toEqual(
          '💥 MalfunctionError: the brain call failed — Request timed out.',
        );
      });
    });
  });
});
