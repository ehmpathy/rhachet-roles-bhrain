import { given, then, when } from 'test-fns';

import { MINUTES_OF_CACHE_REACH } from '@src/domain.operations/review/MINUTES_OF_CACHE_REACH';
import { isMinutesPastCacheReach } from '@src/domain.operations/review/meter/isMinutesPastCacheReach';

import { getOneMinutesSincePriorSend } from './getOneMinutesSincePriorSend';

const TEST_CASES: Array<{
  description: string;
  given: {
    minutesBetweenMints: number | null;
    minutesOfPriorCall: number | null;
  };
  expect: { minutes: number | null; pastReach: boolean };
}> = [
  {
    description:
      '🔴 a prior that ran 8 minutes, minted 70 minutes back, last sent 62 minutes back — within the reach',
    given: { minutesBetweenMints: 70, minutesOfPriorCall: 8 },
    expect: { minutes: 62, pastReach: false },
  },
  {
    description:
      'a prior with a long gap after its send is still past the reach',
    given: { minutesBetweenMints: 120, minutesOfPriorCall: 8 },
    expect: { minutes: 112, pastReach: true },
  },
  {
    description: 'an unmetered prior keeps the mint gap',
    given: {
      minutesBetweenMints: MINUTES_OF_CACHE_REACH,
      minutesOfPriorCall: null,
    },
    expect: { minutes: MINUTES_OF_CACHE_REACH, pastReach: true },
  },
  {
    description: 'an unread mint gap stays unread',
    given: { minutesBetweenMints: null, minutesOfPriorCall: 8 },
    expect: { minutes: null, pastReach: false },
  },
  {
    description:
      'a prior call that outran the mint gap (a pour) reads as no gap, never negative',
    given: { minutesBetweenMints: 2, minutesOfPriorCall: 5 },
    expect: { minutes: 0, pastReach: false },
  },
];

describe('getOneMinutesSincePriorSend', () => {
  given('[case1] a table of prior and round sends', () => {
    TEST_CASES.forEach((thisCase, index) => {
      when(`[t${index}] ${thisCase.description}`, () => {
        then('it reads the expected gap, and its reach verdict', () => {
          const minutes = getOneMinutesSincePriorSend(thisCase.given);
          expect(minutes).toEqual(thisCase.expect.minutes);
          expect(isMinutesPastCacheReach({ minutes })).toEqual(
            thisCase.expect.pastReach,
          );
        });
      });
    });
  });
});
