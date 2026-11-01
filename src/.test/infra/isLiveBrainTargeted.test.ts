import { given, then } from 'test-fns';

import { isLiveBrainTargeted, LIVE_BRAIN_FLAG } from './isLiveBrainTargeted';

const TEST_CASES = [
  { description: 'flag absent → skip', flag: null, expected: false },
  { description: 'flag empty → skip', flag: '', expected: false },
  { description: 'flag names another brain → skip', flag: 'grok', expected: false },
  { description: 'flag names this brain → run', flag: 'claude', expected: true },
  { description: 'flag lists this brain among others → run', flag: 'grok, claude', expected: true },
  { description: 'flag is all → run', flag: 'all', expected: true },
  { description: 'flag names a prefix of this brain → skip', flag: 'clau', expected: false },
];

describe('isLiveBrainTargeted', () => {
  const flagPrior = process.env[LIVE_BRAIN_FLAG];
  afterAll(() => {
    if (flagPrior === undefined) delete process.env[LIVE_BRAIN_FLAG];
    else process.env[LIVE_BRAIN_FLAG] = flagPrior;
  });

  TEST_CASES.map((thisCase) =>
    given(thisCase.description, () => {
      then(`returns ${thisCase.expected} for brain=claude`, () => {
        if (thisCase.flag === null) delete process.env[LIVE_BRAIN_FLAG];
        else process.env[LIVE_BRAIN_FLAG] = thisCase.flag;
        expect(isLiveBrainTargeted({ brain: 'claude' })).toEqual(thisCase.expected);
      });
    }),
  );
});
