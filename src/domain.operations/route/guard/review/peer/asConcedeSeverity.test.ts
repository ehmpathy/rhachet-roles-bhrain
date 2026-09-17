import { getError, given, then, when } from 'test-fns';

import { asConcedeSeverity } from './asConcedeSeverity';

// 🔴 r009 i012 blocker.1 — the invalid-value refusal (the driver's typo path) had no
//    test that put an out-of-set value through the boundary. every extant test passed
//    an already-typed 'better' | 'urgent' literal; naught exercised the throw
describe('asConcedeSeverity', () => {
  given('[case1] no --severity was passed', () => {
    when('[t0] raw is undefined', () => {
      then('it returns undefined — never a default', () => {
        expect(asConcedeSeverity({ raw: undefined })).toBeUndefined();
      });
    });
  });

  given('[case2] a valid --severity was passed', () => {
    when('[t0] raw is "better"', () => {
      then('it narrows to "better"', () => {
        expect(asConcedeSeverity({ raw: 'better' })).toEqual('better');
      });
    });

    when('[t1] raw is "urgent"', () => {
      then('it narrows to "urgent"', () => {
        expect(asConcedeSeverity({ raw: 'urgent' })).toEqual('urgent');
      });
    });
  });

  given('[case3] an INVALID --severity was passed — the typo path', () => {
    when('[t0] raw is "urgnt" (a typo)', () => {
      const error = getError(() => asConcedeSeverity({ raw: 'urgnt' }));

      then('it throws', () => {
        expect(error).toBeInstanceOf(Error);
      });

      then(
        'the message names the bad value and the valid set — pinned whole',
        () => {
          expect(error.message).toMatchSnapshot();
        },
      );
    });

    when('[t1] raw is an empty string', () => {
      then('it throws — an empty string is not a valid grade', () => {
        const error = getError(() => asConcedeSeverity({ raw: '' }));
        expect(error).toBeInstanceOf(Error);
        expect(error.message).toContain('invalid --severity');
      });
    });
  });
});
