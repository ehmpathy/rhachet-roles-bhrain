import type { ReviewRunIdentity } from '@src/domain.objects/Reviewer/ReviewRunIdentity';

import { asPrefixLaneKey } from './asPrefixLaneKey';

/**
 * .what = a guard identity, with chosen fields overridden
 * .why = each case names only the fields it is about
 */
const asIdentity = (input: Partial<ReviewRunIdentity>): ReviewRunIdentity => ({
  route: '.behavior/v2026_09_20.review-cost-meter',
  stone: '5.1',
  iteration: 1,
  hash: 'a1b2c3d',
  index: 1,
  slug: 'repo-rules',
  ...input,
});

const TEST_CASES: Array<{
  description: string;
  left: ReviewRunIdentity;
  right: ReviewRunIdentity;
  same: boolean;
}> = [
  {
    description: 'two rounds of one slug on one route share a key',
    left: asIdentity({}),
    right: asIdentity({ iteration: 2, hash: 'f0f0f0f' }),
    same: true,
  },
  {
    description: 'one slug across two stones of one route shares a key',
    left: asIdentity({ stone: '3.1' }),
    right: asIdentity({ stone: '5.1' }),
    same: true,
  },
  {
    description: 'one slug under two routes is two lanes',
    left: asIdentity({ route: '.behavior/a' }),
    right: asIdentity({ route: '.behavior/b' }),
    same: false,
  },
  {
    description: 'two slugs on one route are two lanes',
    left: asIdentity({ slug: 'repo-rules' }),
    right: asIdentity({ slug: 'repo-tests' }),
    same: false,
  },
  {
    description: 'a run with no route keys apart from one with a route',
    left: asIdentity({ route: null }),
    right: asIdentity({}),
    same: false,
  },
];

describe('asPrefixLaneKey', () => {
  TEST_CASES.map((thisCase) =>
    test(thisCase.description, () => {
      const left = asPrefixLaneKey({ identity: thisCase.left });
      const right = asPrefixLaneKey({ identity: thisCase.right });
      expect(left === right).toEqual(thisCase.same);
    }),
  );
});
