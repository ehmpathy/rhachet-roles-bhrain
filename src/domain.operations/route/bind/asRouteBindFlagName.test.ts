import { given, then, when } from 'test-fns';

import { asRouteBindFlagName } from './asRouteBindFlagName';

/**
 * .what = unit tests for the bind flag filename
 * .why = the bind write, the bind lookup glob, and the status line's flag check and fingerprint
 *        all read this one name; a drift here unbinds every route silently
 */
const TEST_CASES: { description: string; branch: string; expected: string }[] =
  [
    {
      description: 'a flat branch keeps its name',
      branch: 'main',
      expected: '.bind.main.flag',
    },
    {
      description:
        'a slash in the branch is flattened, as the bind ops always have',
      branch: 'human/fix-status-line',
      expected: '.bind.human.fix-status-line.flag',
    },
  ];

describe('asRouteBindFlagName', () => {
  TEST_CASES.map((thisCase, index) =>
    given(`[case${index + 1}] ${thisCase.description}`, () => {
      when('[t0] the flag name is computed', () => {
        then('it names the expected file', () => {
          expect(asRouteBindFlagName({ branch: thisCase.branch })).toEqual(
            thisCase.expected,
          );
        });
      });
    }),
  );
});
