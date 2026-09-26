import { given, then, when } from 'test-fns';

import type { PassageReport } from '@src/domain.objects/Driver/PassageReport';

import { getLatestPassageFromReports } from './getLatestPassageFromReports';

const asReport = (input: {
  stone: string;
  status: PassageReport['status'];
}): PassageReport =>
  ({ stone: input.stone, status: input.status }) as PassageReport;

describe('getLatestPassageFromReports', () => {
  given('an empty reports snapshot', () => {
    when('the latest is folded', () => {
      const latest = getLatestPassageFromReports({ reports: [] });

      then('it is null — no entry to be latest', () => {
        expect(latest).toBe(null);
      });
    });
  });

  given('a snapshot of many reports in raw file order', () => {
    const reports = [
      asReport({ stone: '1.vision', status: 'passed' }),
      asReport({ stone: '5.1.execution', status: 'arrived' }),
      asReport({ stone: '5.1.execution', status: 'blocked' }),
    ];

    when('the latest is folded', () => {
      const latest = getLatestPassageFromReports({ reports });

      then(
        'it is the LAST entry in file order — the drive true-latest state',
        () => {
          expect(latest).toEqual(
            asReport({ stone: '5.1.execution', status: 'blocked' }),
          );
        },
      );
    });
  });

  given('a single-entry snapshot', () => {
    const reports = [asReport({ stone: '1.vision', status: 'arrived' })];

    when('the latest is folded', () => {
      const latest = getLatestPassageFromReports({ reports });

      then('it is that one entry', () => {
        expect(latest).toEqual(
          asReport({ stone: '1.vision', status: 'arrived' }),
        );
      });
    });
  });
});
