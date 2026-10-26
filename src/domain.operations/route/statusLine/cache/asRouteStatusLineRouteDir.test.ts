import { given, then, when } from 'test-fns';

import { asRouteStatusLineRouteDir } from './asRouteStatusLineRouteDir';

/**
 * .what = unit tests for the route dir join
 * .why = the fingerprint and the bind flag check both read the route dir; a route named
 *        relative to cwd and one named absolute must land on the same dir
 */
const TEST_CASES: {
  description: string;
  given: { cwd: string; route: string };
  expected: string;
}[] = [
  {
    description: 'a cwd-relative route joins onto cwd',
    given: { cwd: '/repo', route: '.behavior/v2026_10_24.fix' },
    expected: '/repo/.behavior/v2026_10_24.fix',
  },
  {
    description: 'an absolute route stands as is',
    given: { cwd: '/repo', route: '/elsewhere/route' },
    expected: '/elsewhere/route',
  },
];

describe('asRouteStatusLineRouteDir', () => {
  TEST_CASES.map((thisCase, index) =>
    given(`[case${index + 1}] ${thisCase.description}`, () => {
      when('[t0] the route dir is joined', () => {
        then('it lands on the expected dir', () => {
          expect(asRouteStatusLineRouteDir(thisCase.given)).toEqual(
            thisCase.expected,
          );
        });
      });
    }),
  );
});
