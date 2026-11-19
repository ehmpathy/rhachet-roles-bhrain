import { given, then, when } from 'test-fns';

import { asStatusLineFileWriteFaultRow } from './asStatusLineFileWriteFaultRow';

const TEST_CASES: {
  description: string;
  given: { cause: string; route: string };
  expect: { causeShown: string };
}[] = [
  {
    description: 'an fs fault names its code, the route, and the fix',
    given: { cause: 'ENOSPC', route: '.behavior/v2026_10_26.x' },
    expect: { causeShown: '(ENOSPC)' },
  },
  {
    description: 'a corrupt ledger names itself, the route, and the fix',
    given: { cause: 'corrupt ledger', route: '.behavior/v2026_10_26.x' },
    expect: { causeShown: '(corrupt ledger)' },
  },
];

describe('asStatusLineFileWriteFaultRow', () => {
  TEST_CASES.map((thisCase, index) =>
    given(`[case${index + 1}] ${thisCase.description}`, () => {
      when('[t0] the write fault row is rendered', () => {
        then(
          'it names the cause, the route, the stale read, and the fix',
          () => {
            const row = asStatusLineFileWriteFaultRow(thisCase.given);
            expect(
              row.startsWith(
                '[route.status.line] fault: status file write failed',
              ),
            ).toBe(true);
            expect(row).toContain(thisCase.expect.causeShown);
            expect(row).toContain(`for ${thisCase.given.route}`);
            expect(row).toContain(
              'the line reads stale, or unknown if never written, until the next write',
            );
            expect(row).toContain(
              'fix: repair the cause, then rhx route.drive',
            );
            expect(row).toMatchSnapshot();
          },
        );
      });
    }),
  );
});
