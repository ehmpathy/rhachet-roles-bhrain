import { BadRequestError, MalfunctionError } from 'helpful-errors';
import { given, then, when } from 'test-fns';

import { asStatusLineFaultRow } from './asStatusLineFaultRow';

const TEST_CASES: {
  description: string;
  given: { error: unknown };
  expect: { row: string };
}[] = [
  {
    description:
      'a multi-bind constraint opens with ConstraintError and drops the --route advice',
    given: {
      error: new BadRequestError(
        'multiple routes bound to this branch; pass --route to pick one',
      ),
    },
    expect: {
      row: '✋ ConstraintError: [route.status.line] multiple routes bound to this branch — unbind the extra route(s) so the status line can pick one',
    },
  },
  {
    description:
      'any other constraint opens with ConstraintError and keeps its own message',
    given: { error: new BadRequestError('the bind flag is malformed') },
    expect: {
      row: '✋ ConstraintError: [route.status.line] the bind flag is malformed',
    },
  },
  {
    description:
      'a malfunction opens with MalfunctionError and keeps its own message',
    given: { error: new MalfunctionError('the passage ledger is unreadable') },
    expect: {
      row: '💥 MalfunctionError: [route.status.line] the passage ledger is unreadable',
    },
  },
  {
    description: 'a non-Error throw is a malfunction, its value as the message',
    given: { error: 'a bare string throw' },
    expect: {
      row: '💥 MalfunctionError: [route.status.line] a bare string throw',
    },
  },
];

describe('asStatusLineFaultRow', () => {
  TEST_CASES.map((thisCase, index) =>
    given(`[case${index + 1}] ${thisCase.description}`, () => {
      when('[t0] the fault row is rendered', () => {
        then('it reads the expected row', () => {
          const row = asStatusLineFaultRow(thisCase.given);
          expect(row).toEqual(thisCase.expect.row);
          expect(row).toMatchSnapshot();
        });
      });
    }),
  );
});
