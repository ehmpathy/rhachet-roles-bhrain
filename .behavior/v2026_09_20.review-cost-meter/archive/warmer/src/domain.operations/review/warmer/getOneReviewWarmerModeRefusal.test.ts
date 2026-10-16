import { getOneReviewWarmerModeRefusal } from './getOneReviewWarmerModeRefusal';

const TEST_CASES = [
  {
    description: 'no warmer on a plan run is accepted',
    given: { plan: null, mode: 'plan' as const },
    expect: { refusal: null },
  },
  {
    description: 'no warmer on a paid run is accepted',
    given: { plan: null, mode: 'apply' as const },
    expect: { refusal: null },
  },
  {
    description: 'a warmer on a paid run is accepted',
    given: { plan: { pokes: 12, everyMinutes: 15 }, mode: 'apply' as const },
    expect: { refusal: null },
  },
  {
    description:
      '🔴 --warmer on with --mode plan is refused, never validated then ignored',
    given: { plan: { pokes: 12, everyMinutes: 15 }, mode: 'plan' as const },
    expect: {
      refusal:
        '--warmer 12x,15m cannot run with --mode plan: a preview sends no prompt, so there is no cache to keep warm',
    },
  },
  {
    description:
      '🔴 an explicit cadence with --mode plan is refused, and named',
    given: { plan: { pokes: 3, everyMinutes: 4 }, mode: 'plan' as const },
    expect: {
      refusal:
        '--warmer 3x,4m cannot run with --mode plan: a preview sends no prompt, so there is no cache to keep warm',
    },
  },
];

describe('getOneReviewWarmerModeRefusal', () => {
  TEST_CASES.map((thisCase) =>
    test(thisCase.description, () => {
      const refusal = getOneReviewWarmerModeRefusal(thisCase.given);
      expect(refusal).toEqual(thisCase.expect.refusal);
    }),
  );
});
