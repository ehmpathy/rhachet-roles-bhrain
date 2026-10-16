import { given, then, when } from 'test-fns';

import { getOneReviewLevelPrimeMeet } from './getOneReviewLevelPrimeMeet';

const TEST_CASES = [
  { description: 'a pour of no lanes skips', lanes: 0, expect: 'skip' },
  {
    description: '🔴 a lone lane skips — it has no peer to gather',
    lanes: 1,
    expect: 'skip',
  },
  { description: 'a pour of two lanes joins', lanes: 2, expect: 'join' },
  { description: 'a wide pour joins', lanes: 9, expect: 'join' },
] as const;

describe('getOneReviewLevelPrimeMeet', () => {
  given('[case1] a level pour of N lanes', () => {
    when('[t0] its meet is decided', () => {
      TEST_CASES.map((thisCase) =>
        then(thisCase.description, () => {
          expect(getOneReviewLevelPrimeMeet({ lanes: thisCase.lanes })).toEqual(
            thisCase.expect,
          );
        }),
      );
    });
  });
});
