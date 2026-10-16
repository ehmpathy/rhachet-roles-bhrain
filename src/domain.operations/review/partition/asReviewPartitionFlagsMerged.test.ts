import { given, then, when } from 'test-fns';

import { asReviewPartitionFlagsMerged } from './asReviewPartitionFlagsMerged';
import { asReviewPartitionsFromFlags } from './asReviewPartitionsFromFlags';

const TEST_CASES = [
  {
    description: '🔴 a set of lone slugs is kept byte for byte',
    given: [
      'review={src/review/**, src/a/**}',
      'route=src/route/**,blackbox/x.*',
    ],
    expect: [
      'review={src/review/**, src/a/**}',
      'route=src/route/**,blackbox/x.*',
    ],
  },
  {
    description:
      '🔴 a repeated slug merges into one comma list at its first position, no outer brace',
    given: [
      'route={src/route/*,src/route/stones/**}',
      'review=src/review/**',
      'route=blackbox/driver.route.*,blackbox/__snapshots__/driver.route.*',
    ],
    expect: [
      'route=src/route/*,src/route/stones/**,blackbox/driver.route.*,blackbox/__snapshots__/driver.route.*',
      'review=src/review/**',
    ],
  },
  {
    description: 'a glob named twice in one slug is kept once',
    given: ['route=src/route/**', 'route=src/route/**,blackbox/x.*'],
    expect: ['route=src/route/**,blackbox/x.*'],
  },
];

describe('asReviewPartitionFlagsMerged', () => {
  given('[case1] a set of --partition values', () => {
    when('[t0] the set is merged', () => {
      TEST_CASES.map((thisCase) =>
        then(thisCase.description, () => {
          const merged = asReviewPartitionFlagsMerged({
            partition: thisCase.given,
          });
          expect(merged).toEqual(thisCase.expect);

          // the merged set claims exactly what the given set claims
          expect(asReviewPartitionsFromFlags({ partition: merged })).toEqual(
            asReviewPartitionsFromFlags({ partition: thisCase.given }),
          );
        }),
      );
    });
  });
});
