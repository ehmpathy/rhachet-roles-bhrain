import {
  asReviewPartitionOfPrime,
  NAME_OF_PARTITION_PRIME,
} from './asReviewPartitionOfPrime';

describe('asReviewPartitionOfPrime', () => {
  test('the prime carries the shared prefix and naught of its own to grade', () => {
    const prime = asReviewPartitionOfPrime({
      common: ['.behavior/v2026_10_04.feat/1.vision.md', 'src/shared.ts'],
    });
    expect(prime).toEqual({
      name: NAME_OF_PARTITION_PRIME,
      globs: [],
      common: ['.behavior/v2026_10_04.feat/1.vision.md', 'src/shared.ts'],
      narrow: [],
      commonGraded: [],
    });
  });

  test('the prime name reads as no declared partition', () => {
    expect(NAME_OF_PARTITION_PRIME).toEqual('(prime)');
  });
});
