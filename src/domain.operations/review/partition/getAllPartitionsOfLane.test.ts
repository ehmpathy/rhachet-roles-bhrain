import { asReviewPartitionsFromFlags } from './asReviewPartitionsFromFlags';
import { getAllPartitionsOfLane } from './getAllPartitionsOfLane';

const ROUTE = '.behavior/v2026_01_01.demo';
const PARTITIONS = asReviewPartitionsFromFlags({
  partition: [
    `review={src/review/**,${ROUTE}/**}`,
    `route={src/route/**,${ROUTE}/**}`,
    `cli={src/cli/**,${ROUTE}/**}`,
  ],
});

const TEST_CASES = [
  {
    description: 'a partition that claims a lane target stays in the lane',
    given: { targets: ['src/review/a.ts', 'src/route/b.ts'] },
    expect: ['review', 'route'],
  },
  {
    description:
      'a partition that claims only the route spec drops out of the lane',
    given: { targets: ['src/review/a.ts', `${ROUTE}/1.vision.md`] },
    expect: ['review'],
  },
  {
    description: 'the declared order is kept',
    given: { targets: ['src/cli/c.ts', 'src/review/a.ts'] },
    expect: ['review', 'cli'],
  },
  {
    description: 'a lane with only route-spec targets keeps no partition',
    given: { targets: [`${ROUTE}/1.vision.md`] },
    expect: [],
  },
];

describe('getAllPartitionsOfLane', () => {
  TEST_CASES.map((thisCase) =>
    test(thisCase.description, () => {
      const kept = getAllPartitionsOfLane({
        partitions: PARTITIONS,
        targets: thisCase.given.targets,
        route: ROUTE,
      });
      expect(kept.map((one) => one.slug)).toEqual(thisCase.expect);
    }),
  );
});
