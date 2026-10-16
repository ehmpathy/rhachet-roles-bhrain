import { given, then, when } from 'test-fns';

import { asReviewPartitionsFromFlags } from './asReviewPartitionsFromFlags';
import { getAllTargetsByPartition } from './getAllTargetsByPartition';
import { getOneReviewPartitionCosts } from './getOneReviewPartitionCosts';

describe('getOneReviewPartitionCosts', () => {
  given('[case1] two partitions that share one common file', () => {
    const split = getAllTargetsByPartition({
      targets: ['src/a/x.ts', 'src/b/y.ts', 'src/types.ts'],
      partitions: asReviewPartitionsFromFlags({
        partition: ['a={src/a/**,src/types.ts}', 'b={src/b/**,src/types.ts}'],
      }),
      route: null,
    });
    const tokensByPath = new Map([
      ['src/a/x.ts', 30_000],
      ['src/b/y.ts', 90_000],
      ['src/types.ts', 10_000],
    ]);

    when('[t0] the split is weighed against a 200k window', () => {
      const costs = getOneReviewPartitionCosts({
        split,
        tokensByPath,
        tokensOfHead: 5_000,
        contextWindowTokens: 200_000,
      });

      then('the common mass is the shared file, counted once', () => {
        expect(costs.common).toEqual({ files: 1, tokens: 10_000 });
      });

      then(
        'each partition carries its narrow mass plus the common it lists',
        () => {
          expect(costs.partitions.map((one) => one.narrow)).toEqual([
            { files: 1, tokens: 30_000 },
            { files: 1, tokens: 90_000 },
          ]);
          expect(costs.partitions.map((one) => one.common)).toEqual([
            { files: 1, tokens: 10_000 },
            { files: 1, tokens: 10_000 },
          ]);
        },
      );

      then('the total adds the head every prompt carries', () => {
        expect(costs.partitions[0]!.total).toEqual({
          files: 2,
          tokens: 45_000,
          fits: true,
          limit: 150_000,
        });
      });
    });

    when('[t1] the split is weighed against a 100k window', () => {
      const costs = getOneReviewPartitionCosts({
        split,
        tokensByPath,
        tokensOfHead: 5_000,
        contextWindowTokens: 100_000,
      });

      then(
        '🔴 a partition past 75% of the window does not fit; one under it does',
        () => {
          expect(costs.partitions.map((one) => one.total.fits)).toEqual([
            true,
            false,
          ]);
        },
      );
    });
  });
});
