import { BadRequestError } from 'helpful-errors';

import { asRouteReminderRefusal } from './asRouteReminderRefusal';

const TEST_CASES: {
  description: string;
  given: { message: string; hint: string | null };
  expect: { output: { headline: string; lines: string[] } };
}[] = [
  {
    description: 'a refusal with a hint renders the hint as the fix leaf',
    given: {
      message: 'route.reminder.get takes no --route',
      hint: 'drop --route',
    },
    expect: {
      output: {
        headline: 'route.reminder.get takes no --route',
        lines: ['   └─ fix: drop --route'],
      },
    },
  },
  {
    description: 'a refusal with no metadata renders the headline alone',
    given: { message: '--clone-addr is required', hint: null },
    expect: {
      output: { headline: '--clone-addr is required', lines: [] },
    },
  },
];

describe('asRouteReminderRefusal', () => {
  TEST_CASES.map((thisCase) =>
    test(thisCase.description, () => {
      const error = thisCase.given.hint
        ? new BadRequestError<NonNullable<BadRequestError['metadata']>>(
            thisCase.given.message,
            { hint: thisCase.given.hint },
          )
        : new BadRequestError(thisCase.given.message);
      expect(asRouteReminderRefusal({ error })).toEqual(thisCase.expect.output);
    }),
  );
});
