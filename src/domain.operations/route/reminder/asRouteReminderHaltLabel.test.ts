import { asRouteReminderHaltLabel } from './asRouteReminderHaltLabel';

const TEST_CASES = [
  {
    description: 'a not-live route names its passage status',
    given: {
      activity: {
        active: false,
        reason: 'route-not-live',
        status: 'blocked',
      } as const,
    },
    expect: { output: 'route-not-live, status blocked' },
  },
  {
    description: 'a not-live route with no passage read names the door alone',
    given: {
      activity: {
        active: false,
        reason: 'route-not-live',
        status: null,
      } as const,
    },
    expect: { output: 'route-not-live' },
  },
  {
    description: 'a complete route names the door alone',
    given: {
      activity: {
        active: false,
        reason: 'route-complete',
        status: 'passed',
      } as const,
    },
    expect: { output: 'route-complete' },
  },
];

describe('asRouteReminderHaltLabel', () => {
  TEST_CASES.map((thisCase) =>
    test(thisCase.description, () => {
      expect(
        asRouteReminderHaltLabel({ activity: thisCase.given.activity }),
      ).toEqual(thisCase.expect.output);
    }),
  );
});
