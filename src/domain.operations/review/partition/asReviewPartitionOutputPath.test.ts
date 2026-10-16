import { asReviewRunIdentity } from '@src/domain.operations/review/asReviewRunIdentity';

import { asReviewPartitionOutputPath } from './asReviewPartitionOutputPath';

const OUTPUT =
  '.behavior/v2026_10_04.feat/.reviews/peer/5.3.verification._.review.i003.ee09cef13102f22c3a.r001._.given.by_peer.repo-rules.report.md';

const TEST_CASES = [
  {
    description:
      'a prefix partition writes one dot-dir down, its basename whole',
    given: { of: { name: 'src/domain.operations', index: 0 } },
    expect: `.behavior/v2026_10_04.feat/.reviews/peer/.partition=1.src-domain.operations/${OUTPUT.split('/').pop()}`,
  },
  {
    description: 'the remainder partition slugs without its parens',
    given: { of: { name: '(rest)', index: 2 } },
    expect: `.behavior/v2026_10_04.feat/.reviews/peer/.partition=3.rest/${OUTPUT.split('/').pop()}`,
  },
  {
    description: 'a glob partition slugs its metacharacters away',
    given: { of: { name: 'src/**/*.ts', index: 1 } },
    expect: `.behavior/v2026_10_04.feat/.reviews/peer/.partition=2.src-.ts/${OUTPUT.split('/').pop()}`,
  },
];

describe('asReviewPartitionOutputPath', () => {
  TEST_CASES.map((thisCase) =>
    test(thisCase.description, () => {
      expect(
        asReviewPartitionOutputPath({ output: OUTPUT, ...thisCase.given }),
      ).toEqual(thisCase.expect);
    }),
  );

  test('🔴 the prime writes to its own named dir, ahead of every partition', () => {
    const primePath = asReviewPartitionOutputPath({
      output: OUTPUT,
      of: 'prime',
    });
    expect(primePath).toEqual(
      `.behavior/v2026_10_04.feat/.reviews/peer/.partition=0.prime/${OUTPUT.split('/').pop()}`,
    );
    // never the dir of the first partition, whose ordinal is 1
    expect(primePath).not.toEqual(
      asReviewPartitionOutputPath({
        output: OUTPUT,
        of: { name: 'prime', index: 0 },
      }),
    );
  });

  test('🔴 the meter still attributes a partition run to the lane that split it', () => {
    const identity = asReviewRunIdentity({
      output: asReviewPartitionOutputPath({
        output: OUTPUT,
        of: { name: 'src', index: 0 },
      }),
    });
    expect(identity?.slug).toEqual('repo-rules');
    expect(identity?.stone).toEqual('5.3.verification');
    expect(identity?.route).toEqual('.behavior/v2026_10_04.feat');
  });
});
