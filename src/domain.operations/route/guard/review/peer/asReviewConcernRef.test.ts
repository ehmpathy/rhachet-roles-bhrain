import { BadRequestError } from 'helpful-errors';
import { getError, given, then, when } from 'test-fns';

import {
  asReviewConcernRef,
  asReviewConcernRefLabel,
} from './asReviewConcernRef';

/**
 * .what = unit cases for the `--about <concern>` parser and its inverse renderer
 * .why = it fixes the per-concern grain (S07): a stance targets ONE concern by kind and
 *        a 1-based ordinal. a lax parse would let a driver address a concern the reviewer
 *        never numbered, or address the neighbour by a 0-based off-by-one.
 */

describe('asReviewConcernRef', () => {
  given('[case1] a well-formed blocker ref', () => {
    when('[t0] it is parsed', () => {
      then('it yields the kind and the ordinal', () => {
        expect(asReviewConcernRef({ about: 'blocker.1' })).toEqual({
          kind: 'blocker',
          ordinal: 1,
        });
      });
    });
  });

  given('[case2] a well-formed nitpick ref', () => {
    when('[t0] it is parsed', () => {
      then('it yields the kind and the ordinal', () => {
        expect(asReviewConcernRef({ about: 'nitpick.4' })).toEqual({
          kind: 'nitpick',
          ordinal: 4,
        });
      });
    });
  });

  given('[case3] a ref with no ordinal', () => {
    when('[t0] it is parsed', () => {
      then('it throws, and names the expected shape', () => {
        const error = getError(() => asReviewConcernRef({ about: 'blocker' }));
        expect(error).toBeInstanceOf(BadRequestError);
        expect(error.message).toContain('blocker.1');
      });
    });
  });

  given('[case4] a ref with a kind the contract does not carry', () => {
    when('[t0] it is parsed', () => {
      then('it throws — the two kinds are contract-fixed', () => {
        const error = getError(() => asReviewConcernRef({ about: 'major.2' }));
        expect(error).toBeInstanceOf(BadRequestError);
      });
    });
  });

  given('[case5] a 0-based ordinal', () => {
    when('[t0] it is parsed', () => {
      then(
        'it throws — the ordinal is 1-based, so 0 addresses no concern',
        () => {
          const error = getError(() =>
            asReviewConcernRef({ about: 'nitpick.0' }),
          );
          expect(error).toBeInstanceOf(BadRequestError);
          expect(error.message).toContain('1-based');
        },
      );
    });
  });

  given('[case6] a parsed ref', () => {
    when('[t0] it is rendered back to its --about form', () => {
      then('the render round-trips the parse', () => {
        const ref = asReviewConcernRef({ about: 'blocker.3' });
        expect(asReviewConcernRefLabel({ ref })).toEqual('blocker.3');
      });
    });
  });
});
