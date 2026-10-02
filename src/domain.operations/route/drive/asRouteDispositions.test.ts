import { given, then, when } from 'test-fns';

import { PassageReport } from '@src/domain.objects/Driver/PassageReport';

import { asRouteDispositions } from './asRouteDispositions';

describe('asRouteDispositions', () => {
  given('a set of latest passage reports', () => {
    when('the reports carry a mix of halt and push states', () => {
      then('each report is paired with its derived disposition', () => {
        const pairs = asRouteDispositions({
          reports: [
            new PassageReport({ stone: '1', status: 'malfunction' }),
            new PassageReport({ stone: '2', status: 'passed' }),
            // a blocked passage with NO blocker is a driver wall (--as blocked)
            new PassageReport({ stone: '3', status: 'blocked' }),
          ],
        });

        expect(pairs).toHaveLength(3);
        // report is preserved beside its disposition, in order
        expect(pairs[0]!.report.stone).toEqual('1');
        expect(pairs[0]!.disposition).toEqual({
          of: 'halt',
          why: 'malfunction',
        });
        expect(pairs[1]!.disposition).toEqual({ of: 'push' });
        expect(pairs[2]!.disposition).toEqual({ of: 'halt', why: 'blocked' });
      });
    });

    when('the report set is empty', () => {
      then('the result is empty', () => {
        expect(asRouteDispositions({ reports: [] })).toEqual([]);
      });
    });
  });
});
