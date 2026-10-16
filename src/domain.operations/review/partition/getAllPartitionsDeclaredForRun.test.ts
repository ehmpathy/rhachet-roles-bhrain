import { given, then, when } from 'test-fns';

import { getAllPartitionsDeclaredForRun } from './getAllPartitionsDeclaredForRun';

const ROUTE = '.behavior/v2026_01_01.demo';
const TARGETS = ['src/review/a.ts', `${ROUTE}/1.vision.md`];
const ROUTE_SET = [
  `review={src/review/**,${ROUTE}/**}`,
  `route={src/route/**,${ROUTE}/**}`,
];

describe('getAllPartitionsDeclaredForRun', () => {
  given('[case1] a route set for this reviewer', () => {
    when('[t0] the caller passes no flags of its own', () => {
      then(
        'it reads the route set, narrowed to the partitions with work in its lane',
        () => {
          const partitions = getAllPartitionsDeclaredForRun({
            partitions: [],
            partitionsOfRoute: ROUTE_SET,
            route: ROUTE,
            targets: TARGETS,
          });
          expect(partitions.map((one) => one.slug)).toEqual(['review']);
        },
      );
    });

    when('[t1] the caller passes its own --partition flags', () => {
      then('the caller wins, and its set is not narrowed', () => {
        const partitions = getAllPartitionsDeclaredForRun({
          partitions: [
            `x={src/x/**,${ROUTE}/**}`,
            `review={src/review/**,${ROUTE}/**}`,
          ],
          partitionsOfRoute: ROUTE_SET,
          route: ROUTE,
          targets: TARGETS,
        });
        expect(partitions.map((one) => one.slug)).toEqual(['x', 'review']);
      });
    });
  });

  given('[case2] no route set and no caller flags', () => {
    when('[t0] a run reads its partitions', () => {
      then('it reads none', () => {
        const partitions = getAllPartitionsDeclaredForRun({
          partitions: [],
          partitionsOfRoute: [],
          route: null,
          targets: TARGETS,
        });
        expect(partitions).toEqual([]);
      });
    });
  });
});
