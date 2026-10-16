import { given, then, when } from 'test-fns';

import { asReviewPartitionsFromFlags } from './asReviewPartitionsFromFlags';
import { getAllGlobsUnmatchedOfSplit } from './getAllGlobsUnmatchedOfSplit';
import { getAllTargetsByPartition } from './getAllTargetsByPartition';

const TARGETS = [
  'src/route/a.ts',
  'blackbox/driver.route.drive.acceptance.test.ts',
  'blackbox/__snapshots__/driver.route.drive.acceptance.test.ts.snap',
];

const ROUTE = '.behavior/v2026_01_01.demo';

const TEST_CASES = [
  {
    description: 'a set whose every glob matched flags none',
    given: {
      partition: [
        'route=src/route/**,blackbox/driver.route.*,blackbox/__snapshots__/driver.route.*',
      ],
      route: null,
    },
    expect: [],
  },
  {
    description: '🔴 a typo glob is flagged by slug',
    given: {
      partition: [
        'route=src/route/**,blackbox/driver.rout.*,blackbox/__snapshots__/driver.route.*',
      ],
      route: null,
    },
    expect: [{ slug: 'route', glob: 'blackbox/driver.rout.*' }],
  },
  {
    description: 'a prefix member with no change beneath it is flagged',
    given: {
      partition: [
        'route=src/route,src/domain.objects,blackbox/driver.route.*,blackbox/__snapshots__/driver.route.*',
      ],
      route: null,
    },
    expect: [{ slug: 'route', glob: 'src/domain.objects' }],
  },
  {
    description:
      'a glob that matches a file another partition also claims is not flagged',
    given: {
      partition: [
        'route=src/route/**,blackbox/**',
        'drive=blackbox/driver.route.drive.*',
      ],
      route: null,
    },
    expect: [],
  },
  {
    description:
      'a glob that claims the bound route is not flagged, though the spec saw no change',
    given: {
      partition: [`route=src/route/**,blackbox/**,${ROUTE}/**`],
      route: ROUTE,
    },
    expect: [],
  },
  {
    description:
      'a route glob with no route bound is flagged, since it matched no changed file',
    given: {
      partition: [`route=src/route/**,blackbox/**,${ROUTE}/**`],
      route: null,
    },
    expect: [{ slug: 'route', glob: `${ROUTE}/**` }],
  },
];

describe('getAllGlobsUnmatchedOfSplit', () => {
  given('[case1] a split of the targets', () => {
    when('[t0] the zero-match globs are listed', () => {
      TEST_CASES.map((thisCase) =>
        then(thisCase.description, () => {
          const split = getAllTargetsByPartition({
            targets: TARGETS,
            partitions: asReviewPartitionsFromFlags({
              partition: thisCase.given.partition,
            }),
            route: null,
          });
          expect(
            getAllGlobsUnmatchedOfSplit({ split, route: thisCase.given.route }),
          ).toEqual(thisCase.expect);
        }),
      );
    });
  });
});
