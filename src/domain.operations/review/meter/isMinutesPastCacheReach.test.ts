import { given, then, when } from 'test-fns';

import { MINUTES_OF_CACHE_REACH } from '@src/domain.operations/review/MINUTES_OF_CACHE_REACH';

import { isMinutesPastCacheReach } from './isMinutesPastCacheReach';

const TEST_CASES: Array<{
  description: string;
  minutes: number | null;
  expected: boolean;
}> = [
  { description: 'within the reach', minutes: 12, expected: false },
  {
    description:
      '🔴 exactly at the reach is past it — one boundary for every reader',
    minutes: MINUTES_OF_CACHE_REACH,
    expected: true,
  },
  { description: 'past the reach', minutes: 120, expected: true },
  {
    description: 'an unread gap proves no lapse',
    minutes: null,
    expected: false,
  },
];

describe('isMinutesPastCacheReach', () => {
  given('[case1] a table of gaps', () => {
    TEST_CASES.forEach((thisCase, index) => {
      when(`[t${index}] ${thisCase.description}`, () => {
        then('it reads the expected verdict', () => {
          expect(
            isMinutesPastCacheReach({ minutes: thisCase.minutes }),
          ).toEqual(thisCase.expected);
        });
      });
    });
  });
});
