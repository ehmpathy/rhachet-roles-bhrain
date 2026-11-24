import type { PassageReport } from '@src/domain.objects/Driver/PassageReport';

import { isReminderLiveForPassage } from './isReminderLiveForPassage';

const TEST_CASES: {
  description: string;
  given: { status: PassageReport['status']; reason: string | null };
  expect: boolean;
}[] = [
  {
    description:
      'an exhausted stone with an URGENT concession is live — the grant is the driver’s',
    given: {
      status: 'exhausted',
      reason:
        'an urgent concession earned a round (mech); peer reviewer budget exhausted: mech',
    },
    expect: true,
  },
  {
    description:
      'an exhausted stone with a BETTER concession is live — the fix is the driver’s',
    given: {
      status: 'exhausted',
      reason:
        'concessions await the round that confirms them; peer reviewer budget exhausted: mech',
    },
    expect: true,
  },
  {
    description:
      'an ordinary exhausted stone is dead — a human must approve or extend',
    given: {
      status: 'exhausted',
      reason: 'peer reviewer budget exhausted: mech',
    },
    expect: false,
  },
  {
    description:
      'an exhausted stone with no reason is dead — absence is not a claim',
    given: { status: 'exhausted', reason: null },
    expect: false,
  },
  {
    description:
      'a malfunction with an urgent mark is dead — a broken reviewer needs a human',
    given: {
      status: 'malfunction',
      reason:
        'reviewer or judge malfunctioned; an urgent concession earned a round; peer reviewer budget exhausted: mech',
    },
    expect: false,
  },
  {
    description: 'any other status defers to the status map',
    given: { status: 'arrived', reason: null },
    expect: true,
  },
];

describe('isReminderLiveForPassage', () => {
  TEST_CASES.map((thisCase) =>
    test(thisCase.description, () => {
      expect(isReminderLiveForPassage(thisCase.given)).toEqual(thisCase.expect);
    }),
  );
});
