import { given, then, when } from 'test-fns';

import type { PassageReport } from '@src/domain.objects/Driver/PassageReport';

import { getPassageReportsSinceLastRewind } from './getPassageReportsSinceLastRewind';

/**
 * .what = unit cases for the rewind boundary over one stone's ledger
 * .why = a rewind voids the round, and the given-path key alone does not carry that —
 *        an unchanged artifact re-mints the identical given path, so a rewound stance
 *        would re-attach and the driver's one undo would do naught (r10 b6)
 */
const asReport = (input: {
  status: PassageReport['status'];
  about?: string;
}): PassageReport =>
  ({
    stone: '1.test',
    status: input.status,
    ...(input.about
      ? { about: input.about, reviewer: 'lane', given: 'g1' }
      : {}),
  }) as PassageReport;

describe('getPassageReportsSinceLastRewind', () => {
  given('[case1] a ledger with no rewind', () => {
    const reports = [
      asReport({ status: 'disputed', about: 'blocker.1' }),
      asReport({ status: 'conceded', about: 'nitpick.1' }),
    ];

    when('[t0] read', () => {
      then('every report stands', () => {
        expect(getPassageReportsSinceLastRewind({ reports })).toEqual(reports);
      });
    });
  });

  given('[case2] a rewind after two absorptions', () => {
    const reports = [
      asReport({ status: 'disputed', about: 'blocker.1' }),
      asReport({ status: 'conceded', about: 'nitpick.1' }),
      asReport({ status: 'rewound' }),
    ];

    when('[t0] read', () => {
      then('naught stands — the round was voided', () => {
        expect(getPassageReportsSinceLastRewind({ reports })).toEqual([]);
      });
    });
  });

  given('[case3] a fresh absorption AFTER the rewind', () => {
    const disputeFresh = asReport({ status: 'disputed', about: 'blocker.2' });
    const reports = [
      asReport({ status: 'disputed', about: 'blocker.1' }),
      asReport({ status: 'rewound' }),
      disputeFresh,
    ];

    when('[t0] read', () => {
      then('only the fresh one stands', () => {
        expect(getPassageReportsSinceLastRewind({ reports })).toEqual([
          disputeFresh,
        ]);
      });
    });
  });

  given('[case4] TWO rewinds — the boundary is the LAST one', () => {
    const disputeLast = asReport({ status: 'disputed', about: 'blocker.3' });
    const reports = [
      asReport({ status: 'disputed', about: 'blocker.1' }),
      asReport({ status: 'rewound' }),
      asReport({ status: 'disputed', about: 'blocker.2' }),
      asReport({ status: 'rewound' }),
      disputeLast,
    ];

    when('[t0] read', () => {
      then('the mid-ledger absorption is void too', () => {
        expect(getPassageReportsSinceLastRewind({ reports })).toEqual([
          disputeLast,
        ]);
      });
    });
  });

  given('[case5] an empty ledger', () => {
    when('[t0] read', () => {
      then('it yields an empty list, never a throw', () => {
        expect(getPassageReportsSinceLastRewind({ reports: [] })).toEqual([]);
      });
    });
  });
});
