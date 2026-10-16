import { BadRequestError } from 'helpful-errors';
import { given, then, when } from 'test-fns';

import { ReviewOverflowRefusedError } from './ReviewOverflowRefusedError';
import { ReviewRefusalEmittedError } from './ReviewRefusalEmittedError';

describe('ReviewRefusalEmittedError', () => {
  given('[case1] a refusal whose frame is already on stderr', () => {
    when('[t0] it is constructed', () => {
      const error = new ReviewRefusalEmittedError(
        'combined scope resolves to zero files',
      );

      then(
        'it is a BadRequestError, so every constraint check reads it',
        () => {
          expect(error).toBeInstanceOf(BadRequestError);
        },
      );

      then('its own name is the narrow type', () => {
        expect(error.name).toEqual('ReviewRefusalEmittedError');
      });

      then('the header an sdk caller reads keeps the parent class', () => {
        expect(error.message).toContain('BadRequestError');
        expect(error.message).not.toContain('ReviewRefusalEmittedError');
        expect(error.message).toContain(
          'combined scope resolves to zero files',
        );
      });
    });
  });

  given('[case2] an overflow refusal', () => {
    when('[t0] it is constructed', () => {
      const error = new ReviewOverflowRefusedError();

      then(
        'it is a ReviewRefusalEmittedError, so the cli does not reprint its frame',
        () => {
          expect(error).toBeInstanceOf(ReviewRefusalEmittedError);
        },
      );
    });
  });
});
