import { given, then, when } from 'test-fns';

import { asRouteGuardPartitionsPruned } from './asRouteGuardPartitionsPruned';

const ROUTE = '.behavior/v2026_01_01.demo';

const HELD = [
  `review=src/review/**,${ROUTE}/**,src/review/gone.ts`,
  `route=src/route/**,${ROUTE}/**`,
];

describe('asRouteGuardPartitionsPruned', () => {
  given('[case1] one stale glob pruned, no --from', () => {
    when('[t0] the prune is applied', () => {
      const result = asRouteGuardPartitionsPruned({
        partition: HELD,
        prunes: [{ glob: 'src/review/gone.ts', from: null }],
      });

      then(
        '🔴 the whole set comes back, the glob gone from the partition that held it',
        () => {
          expect(result).toEqual({
            partition: [
              `review=src/review/**,${ROUTE}/**`,
              `route=src/route/**,${ROUTE}/**`,
            ],
            unheld: [],
          });
        },
      );

      then('🔴 every other partition keeps its bytes', () => {
        expect(result.partition?.[1]).toEqual(HELD[1]);
      });
    });
  });

  given('[case2] a glob two partitions share, pruned --from one', () => {
    when('[t0] the prune is applied', () => {
      const result = asRouteGuardPartitionsPruned({
        partition: [
          `review=src/review/**,src/types/**`,
          `route=src/route/**,src/types/**`,
        ],
        prunes: [{ glob: 'src/types/**', from: 'route' }],
      });

      then('it leaves the glob in the partition not named', () => {
        expect(result.partition).toEqual([
          `review=src/review/**,src/types/**`,
          `route=src/route/**`,
        ]);
      });
    });

    when('[t1] the same glob is pruned with no --from', () => {
      const result = asRouteGuardPartitionsPruned({
        partition: [
          `review=src/review/**,src/types/**`,
          `route=src/route/**,src/types/**`,
        ],
        prunes: [{ glob: 'src/types/**', from: null }],
      });

      then('it drops the glob from every partition that held it', () => {
        expect(result.partition).toEqual([
          `review=src/review/**`,
          `route=src/route/**`,
        ]);
      });
    });
  });

  given('[case3] a comma list pruned', () => {
    when('[t0] the prune is applied', () => {
      const result = asRouteGuardPartitionsPruned({
        partition: [`review=src/review/**,a.ts,b.ts`],
        prunes: [{ glob: 'a.ts,b.ts', from: null }],
      });

      then('each member of the list is dropped', () => {
        expect(result.partition).toEqual([`review=src/review/**`]);
      });
    });
  });

  given('[case4] a partition whose every glob is pruned', () => {
    when('[t0] the prune is applied', () => {
      const result = asRouteGuardPartitionsPruned({
        partition: [`review=src/review/**`, `old=src/old/**`],
        prunes: [{ glob: 'src/old/**', from: null }],
      });

      then('the emptied partition drops from the set', () => {
        expect(result.partition).toEqual([`review=src/review/**`]);
      });
    });
  });

  given('[case5] a glob no partition holds', () => {
    when('[t0] the prune is applied', () => {
      const result = asRouteGuardPartitionsPruned({
        partition: HELD,
        prunes: [
          { glob: 'src/typo/**', from: null },
          { glob: 'src/route/**', from: 'review' },
        ],
      });

      then(
        '🔴 it is refused: no set, and each unheld glob named with where it was sought',
        () => {
          expect(result).toEqual({
            partition: null,
            unheld: ['src/typo/**', 'src/route/** (from review)'],
          });
        },
      );
    });
  });
});
