import { UnexpectedCodePathError } from 'helpful-errors';

import { isExpectedLegacyReapFault } from './isExpectedLegacyReapFault';
import { RouteReminderPidMalformedError } from './RouteReminderPidMalformedError';

const asErrno = (code: string): Error =>
  Object.assign(new Error(`${code}: fault`), { code });

const TEST_CASES: {
  description: string;
  error: unknown;
  expected: boolean;
}[] = [
  {
    description: 'a torn pid file is expected — the handle is kept',
    error: new RouteReminderPidMalformedError(
      'RouteReminder pid file is malformed',
      { pidPath: '/x.pid', raw: '123abc' },
    ),
    expected: true,
  },
  {
    description: 'an EPERM signal on a recycled pid is expected',
    error: asErrno('EPERM'),
    expected: true,
  },
  {
    description: 'an ENOTDIR on the handle dir is expected',
    error: asErrno('ENOTDIR'),
    expected: true,
  },
  {
    description: 'a TypeError from a defect is not expected — it rethrows',
    error: new TypeError('x is not a function'),
    expected: false,
  },
  {
    description: 'another invariant break is not expected',
    error: new UnexpectedCodePathError('some other invariant', {}),
    expected: false,
  },
  {
    description: 'a thrown non-error is not expected',
    error: 'a string',
    expected: false,
  },
];

describe('isExpectedLegacyReapFault', () => {
  TEST_CASES.map((thisCase) =>
    test(thisCase.description, () => {
      expect(isExpectedLegacyReapFault({ error: thisCase.error })).toEqual(
        thisCase.expected,
      );
    }),
  );
});
