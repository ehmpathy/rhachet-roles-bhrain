import type { ConcessionExhaustionKind } from '../guard/review/peer/getStoneConcededLaneSlugs';
import { isRouteDriveExhaustionStopBlocked } from './isRouteDriveExhaustionStopBlocked';

const TEST_CASES: {
  description: string;
  given: { concession: ConcessionExhaustionKind };
  expect: boolean;
}[] = [
  {
    description:
      'a `better` concession blocks the stop — the fix is the driver’s',
    given: { concession: 'better' },
    expect: true,
  },
  {
    description:
      'an `urgent` concession blocks the stop — the grant is the driver’s, never a human ask',
    given: { concession: 'urgent' },
    expect: true,
  },
  {
    description: 'no concession allows the stop — the lane awaits a human',
    given: { concession: 'none' },
    expect: false,
  },
];

describe('isRouteDriveExhaustionStopBlocked', () => {
  TEST_CASES.map((thisCase) =>
    test(thisCase.description, () => {
      expect(isRouteDriveExhaustionStopBlocked(thisCase.given)).toEqual(
        thisCase.expect,
      );
    }),
  );
});
