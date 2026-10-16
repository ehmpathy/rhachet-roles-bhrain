import { UnexpectedCodePathError } from 'helpful-errors';
import { getError, given, then, when } from 'test-fns';

import { asReviewChoice } from './asReviewChoice';

describe('asReviewChoice', () => {
  given('[case1] a value inside its flag closed set', () => {
    when('[t0] narrowed', () => {
      then('it returns the value, typed to the set', () => {
        const polluters: 'drop' | 'keep' = asReviewChoice({
          flag: 'polluters',
          value: 'keep',
        });
        expect(polluters).toEqual('keep');
      });
    });
  });

  given('[case2] a value outside its flag closed set', () => {
    when('[t0] narrowed', () => {
      then(
        'it throws, since the refusal check should have refused it',
        async () => {
          const error = await getError(async () =>
            asReviewChoice({ flag: 'focus', value: 'pul' }),
          );
          expect(error).toBeInstanceOf(UnexpectedCodePathError);
          expect(error.message).toContain('--focus');
        },
      );
    });
  });
});
