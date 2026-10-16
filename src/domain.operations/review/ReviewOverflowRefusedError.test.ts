import { BadRequestError } from 'helpful-errors';
import { given, then, when } from 'test-fns';

import { ReviewOverflowRefusedError } from './ReviewOverflowRefusedError';

describe('ReviewOverflowRefusedError', () => {
  given('[case1] an overflow refusal', () => {
    when('[t0] it is constructed', () => {
      const error = new ReviewOverflowRefusedError();

      then(
        'it is a BadRequestError, so every constraint check reads it',
        () => {
          expect(error).toBeInstanceOf(BadRequestError);
        },
      );

      then('its own name is the narrow type', () => {
        expect(error.name).toEqual('ReviewOverflowRefusedError');
      });

      then('the header a human reads keeps the parent class', () => {
        expect(error.message).toContain('BadRequestError');
        expect(error.message).not.toContain('ReviewOverflowRefusedError');
        expect(error.message).toContain('prompt exceeds 75% of context window');
      });
    });
  });
});
