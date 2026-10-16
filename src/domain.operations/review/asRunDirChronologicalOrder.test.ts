import { given, then, when } from 'test-fns';

import { asRunDirChronologicalOrder } from './asRunDirChronologicalOrder';

describe('asRunDirChronologicalOrder', () => {
  given('[case1] runs whose log dirs were minted out of list order', () => {
    const runs = [
      { dir: '/repo/.log/bhrain/review/2026-09-24T14-09-52-123Z.b' },
      { dir: '/elsewhere/2026-09-24T14-01-00-000Z.c' },
      { dir: '/repo/.log/bhrain/review/2026-09-24T14-05-00-000Z.a' },
    ];

    when('[t0] the runs are sorted by the comparator', () => {
      const sorted = [...runs].sort((a, b) =>
        asRunDirChronologicalOrder({ a, b }),
      );

      then('they read oldest first, by the basename stamp alone', () => {
        expect(sorted.map((run) => run.dir)).toEqual([
          '/elsewhere/2026-09-24T14-01-00-000Z.c',
          '/repo/.log/bhrain/review/2026-09-24T14-05-00-000Z.a',
          '/repo/.log/bhrain/review/2026-09-24T14-09-52-123Z.b',
        ]);
      });
    });
  });
});
