import { given, then, when } from 'test-fns';

import { asReviewPartitionsFromFlags } from './asReviewPartitionsFromFlags';
import { getAllTargetsByPartition } from './getAllTargetsByPartition';

const ROUTE = '.behavior/v2026_01_01.demo';

describe('getAllTargetsByPartition', () => {
  given('[case1] three partitions whose sets overlap', () => {
    const targets = [
      'src/review/a.ts',
      'src/route/b.ts',
      'src/domain.objects/Stone.ts',
      'src/utils/x.ts',
      `${ROUTE}/1.vision.md`,
    ];
    const partitions = asReviewPartitionsFromFlags({
      partition: [
        `review={src/review/**,src/domain.objects/**,src/utils/**,${ROUTE}/**}`,
        `route={src/route/**,src/domain.objects/**,${ROUTE}/**}`,
        `utils={src/utils/**,${ROUTE}/**}`,
      ],
    });

    when('[t0] the targets are split', () => {
      const split = getAllTargetsByPartition({
        targets,
        partitions,
        route: ROUTE,
      });

      then(
        'common holds every target two or more partitions claim, widest share first',
        () => {
          expect(split.common).toEqual([
            `${ROUTE}/1.vision.md`,
            'src/domain.objects/Stone.ts',
            'src/utils/x.ts',
          ]);
        },
      );

      then('narrow holds the targets one partition alone claims', () => {
        expect(split.partitions.map((one) => one.narrow)).toEqual([
          ['src/review/a.ts'],
          ['src/route/b.ts'],
          [],
        ]);
      });

      then("each partition's common share keeps the breadth order", () => {
        expect(split.partitions[1]!.common).toEqual([
          `${ROUTE}/1.vision.md`,
          'src/domain.objects/Stone.ts',
        ]);
      });

      then(
        '🔴 a common target is graded once, by the first partition declared to list it',
        () => {
          expect(split.partitions.map((one) => one.commonGraded)).toEqual([
            [
              `${ROUTE}/1.vision.md`,
              'src/domain.objects/Stone.ts',
              'src/utils/x.ts',
            ],
            [],
            [],
          ]);
        },
      );

      then('no target is unclaimed and no partition lacks the route', () => {
        expect(split.unclaimed).toEqual([]);
        expect(split.routeAbsentFrom).toEqual([]);
      });

      then('the declared globs ride along, verbatim', () => {
        expect(split.partitions[2]!.globs).toEqual([
          'src/utils/**',
          `${ROUTE}/**`,
        ]);
      });
    });
  });

  given('[case2] a target no partition claims', () => {
    when('[t0] the targets are split', () => {
      const split = getAllTargetsByPartition({
        targets: ['src/review/a.ts', 'blackbox/x.ts'],
        partitions: asReviewPartitionsFromFlags({
          partition: ['review=src/review'],
        }),
        route: null,
      });

      then('🔴 it is returned as unclaimed, for the caller to refuse', () => {
        expect(split.unclaimed).toEqual(['blackbox/x.ts']);
      });
    });
  });

  given('[case3] a bound route one partition omits', () => {
    when('[t0] the run touched a route file', () => {
      const split = getAllTargetsByPartition({
        targets: ['src/a.ts', `${ROUTE}/1.vision.md`],
        partitions: asReviewPartitionsFromFlags({
          partition: [`a={src/**,${ROUTE}/**}`, 'b=src/**'],
        }),
        route: ROUTE,
      });

      then('🔴 the partition that lacks the route is named', () => {
        expect(split.routeAbsentFrom).toEqual(['b']);
      });
    });

    when('[t1] the run touched no route file', () => {
      const split = getAllTargetsByPartition({
        targets: ['src/a.ts'],
        partitions: asReviewPartitionsFromFlags({
          partition: [`a={src/**,${ROUTE}/**}`, 'b=src/**'],
        }),
        route: ROUTE,
      });

      then(
        '🔴 the route is still probed, so a partition that omits it is still named',
        () => {
          expect(split.routeAbsentFrom).toEqual(['b']);
        },
      );
    });
  });

  given('[case4] no route bound', () => {
    when('[t0] the targets are split', () => {
      const split = getAllTargetsByPartition({
        targets: ['src/a.ts'],
        partitions: asReviewPartitionsFromFlags({ partition: ['a=src'] }),
        route: null,
      });

      then('the route check is empty — a generic review needs no route', () => {
        expect(split.routeAbsentFrom).toEqual([]);
      });
    });
  });

  given('[case5] a peer dir that merely shares a prefix', () => {
    when('[t0] the targets are split', () => {
      const split = getAllTargetsByPartition({
        targets: ['src-legacy/a.ts'],
        partitions: asReviewPartitionsFromFlags({ partition: ['a=src'] }),
        route: null,
      });

      then('the prefix does not claim it — the slash is the bound', () => {
        expect(split.unclaimed).toEqual(['src-legacy/a.ts']);
      });
    });
  });
});
