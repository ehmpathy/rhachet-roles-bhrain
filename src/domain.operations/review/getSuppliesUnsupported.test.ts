import { given, then, when } from 'test-fns';

import { getSuppliesUnsupported } from './getSuppliesOptionalSupported';

/**
 * .what = unit test for the --optional supply-name validator transformer
 * .why = both review() (CLI) and stepReview() (SDK) fail loud on any supply --optional does not
 *        support; this clamps the shared pure membership logic (rule.require.test-coverage-by-grain)
 *        without a brain round-trip
 */
describe('getSuppliesUnsupported', () => {
  given('[case1] only the supported supply (rules)', () => {
    when('[t0] filtered', () => {
      then('returns none unsupported', () => {
        expect(getSuppliesUnsupported({ supplies: ['rules'] })).toEqual([]);
      });
    });
  });

  given('[case2] a deferred supply (refs)', () => {
    when('[t0] filtered', () => {
      then('returns refs as unsupported', () => {
        expect(getSuppliesUnsupported({ supplies: ['refs'] })).toEqual([
          'refs',
        ]);
      });
    });
  });

  given('[case3] an unknown supply (foo)', () => {
    when('[t0] filtered', () => {
      then('returns foo as unsupported', () => {
        expect(getSuppliesUnsupported({ supplies: ['foo'] })).toEqual(['foo']);
      });
    });
  });

  given('[case4] a mix of supported and unsupported supplies', () => {
    when('[t0] filtered', () => {
      then('returns only the unsupported ones, order preserved', () => {
        expect(
          getSuppliesUnsupported({ supplies: ['rules', 'refs', 'foo'] }),
        ).toEqual(['refs', 'foo']);
      });
    });
  });

  given('[case5] an empty supply list', () => {
    when('[t0] filtered', () => {
      then('returns none unsupported', () => {
        expect(getSuppliesUnsupported({ supplies: [] })).toEqual([]);
      });
    });
  });
});
