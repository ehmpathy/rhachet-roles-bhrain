import { asReviewPartitionCountsLabel } from './asReviewPartitionCountsLabel';
import { asReviewPartitionUnclaimedLabel } from './asReviewPartitionUnclaimedLabel';

/**
 * .what = the one counts label and the one unclaimed label, which the review's overflow split,
 *         its plan, and both route partition trees read
 * .why = clamp: the review split once wrote `M common targets` and the route trees `M common`.
 *        both now read these, so the words cannot drift apart again
 */
const CASES_OF_COUNTS = [
  {
    description: 'plural counts on both sides',
    given: { name: 'review', narrow: ['a', 'b'], common: ['c', 'd'] },
    expect: { output: 'review: 2 narrow targets + 2 common targets' },
  },
  {
    description: 'singular counts agree with their nouns',
    given: { name: 'route', narrow: ['a'], common: ['c'] },
    expect: { output: 'route: 1 narrow target + 1 common target' },
  },
  {
    description: 'a partition with no common target still names the zero',
    given: { name: 'logic', narrow: ['a'], common: [] },
    expect: { output: 'logic: 1 narrow target + 0 common targets' },
  },
];

const CASES_OF_UNCLAIMED = [
  {
    description: 'no target unclaimed',
    given: { unclaimed: [] },
    expect: { output: 'unclaimed: 0' },
  },
  {
    description: 'two targets unclaimed',
    given: { unclaimed: ['a.ts', 'b.ts'] },
    expect: { output: 'unclaimed: 2' },
  },
];

describe('asReviewPartitionCountsLabel', () => {
  CASES_OF_COUNTS.map((thisCase) =>
    test(thisCase.description, () => {
      expect(
        asReviewPartitionCountsLabel({ partition: thisCase.given }),
      ).toEqual(thisCase.expect.output);
    }),
  );
});

describe('asReviewPartitionUnclaimedLabel', () => {
  CASES_OF_UNCLAIMED.map((thisCase) =>
    test(thisCase.description, () => {
      expect(
        asReviewPartitionUnclaimedLabel({ split: thisCase.given }),
      ).toEqual(thisCase.expect.output);
    }),
  );
});
