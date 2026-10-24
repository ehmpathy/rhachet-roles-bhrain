import {
  asExhaustedReasonForDisplay,
  asUrgentConcessionSlugs,
  genRouteGuardExhaustedReason,
  isRouteGuardUrgentConcessionExhaustion,
} from './genRouteGuardExhaustedReason';

const TEST_CASES = [
  {
    description: 'an ordinary exhaustion carries no mark and no urgent lanes',
    given: {
      slugs: ['intent', 'friction'],
      concession: 'none' as const,
      slugsUrgent: [],
    },
    expect: {
      reason: 'peer reviewer budget exhausted: intent, friction',
      slugsUrgent: [],
    },
  },
  {
    description:
      'a better exhaustion carries the better mark and no urgent lanes',
    given: {
      slugs: ['intent'],
      concession: 'better' as const,
      slugsUrgent: [],
    },
    expect: {
      reason:
        'concessions await the round that confirms them; peer reviewer budget exhausted: intent',
      slugsUrgent: [],
    },
  },
  {
    description:
      'an urgent exhaustion names its urgent lanes inside the mark, ahead of the colon',
    given: {
      slugs: ['intent', 'friction'],
      concession: 'urgent' as const,
      slugsUrgent: ['intent'],
    },
    expect: {
      reason:
        'an urgent concession earned a round (intent); peer reviewer budget exhausted: intent, friction',
      slugsUrgent: ['intent'],
    },
  },
  {
    description:
      'an urgent exhaustion with two urgent lanes names both, in order',
    given: {
      slugs: ['intent', 'friction'],
      concession: 'urgent' as const,
      slugsUrgent: ['intent', 'friction'],
    },
    expect: {
      reason:
        'an urgent concession earned a round (intent, friction); peer reviewer budget exhausted: intent, friction',
      slugsUrgent: ['intent', 'friction'],
    },
  },
  {
    description:
      'an urgent exhaustion with no lanes named keeps the legacy mark',
    given: {
      slugs: ['intent'],
      concession: 'urgent' as const,
      slugsUrgent: [],
    },
    expect: {
      reason:
        'an urgent concession earned a round; peer reviewer budget exhausted: intent',
      slugsUrgent: [],
    },
  },
];

describe('genRouteGuardExhaustedReason', () => {
  TEST_CASES.map((thisCase) =>
    test(thisCase.description, () => {
      const reason = genRouteGuardExhaustedReason(thisCase.given);
      expect(reason).toEqual(thisCase.expect.reason);

      // the read recovers what the write named — one shape on both ends
      expect(asUrgentConcessionSlugs({ reason })).toEqual(
        thisCase.expect.slugsUrgent,
      );

      // the urgent predicate still reads the mark with lanes in it
      expect(isRouteGuardUrgentConcessionExhaustion({ reason })).toEqual(
        thisCase.given.concession === 'urgent',
      );
    }),
  );

  test('a null reason names no urgent lanes', () => {
    expect(asUrgentConcessionSlugs({ reason: null })).toEqual([]);
  });

  test('the display form drops the urgent lane list, and leaves all else', () => {
    expect(
      asExhaustedReasonForDisplay({
        reason:
          'reviewer or judge malfunctioned; an urgent concession earned a round (intent, friction); peer reviewer budget exhausted: intent, friction',
      }),
    ).toEqual(
      'reviewer or judge malfunctioned; an urgent concession earned a round; peer reviewer budget exhausted: intent, friction',
    );
    expect(
      asExhaustedReasonForDisplay({
        reason: 'peer reviewer budget exhausted: intent',
      }),
    ).toEqual('peer reviewer budget exhausted: intent');
  });
});
