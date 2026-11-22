import { asRouteReminderMalfunction } from './asRouteReminderMalfunction';

const asErrorWithStack = (input: {
  message: string;
  stack: string | null;
}): Error => {
  const error = new Error(input.message);
  error.stack = input.stack ?? undefined;
  return error;
};

const TEST_CASES: {
  description: string;
  given: { message: string; stack: string | null };
  expect: { output: { headline: string; lines: string[] } };
}[] = [
  {
    description: 'a fault with a stack renders the fix leaf, then each frame',
    given: {
      message: 'EACCES: permission denied, open <focus>',
      stack: [
        'Error: EACCES: permission denied, open <focus>',
        '    at setRouteReminderFocus (setRouteReminderFocus.ts:46:5)',
        '    at routeReminderGen (route.reminder.ts:411:3)',
      ].join('\n'),
    },
    expect: {
      output: {
        headline: 'EACCES: permission denied, open <focus>',
        lines: [
          '   ├─ fix: a defect in route.reminder, not a flag to change; report it with its stack',
          '   └─ stack',
          '      ├─ at setRouteReminderFocus (setRouteReminderFocus.ts:46:5)',
          '      └─ at routeReminderGen (route.reminder.ts:411:3)',
        ],
      },
    },
  },
  {
    description: 'a fault with no stack renders the fix leaf alone',
    given: { message: 'the daemon could not start', stack: null },
    expect: {
      output: {
        headline: 'the daemon could not start',
        lines: [
          '   └─ fix: a defect in route.reminder, not a flag to change; report it with its stack',
        ],
      },
    },
  },
];

describe('asRouteReminderMalfunction', () => {
  TEST_CASES.map((thisCase) =>
    test(thisCase.description, () => {
      expect(
        asRouteReminderMalfunction({ error: asErrorWithStack(thisCase.given) }),
      ).toEqual(thisCase.expect.output);
    }),
  );
});
