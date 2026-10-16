import { given, then, when } from 'test-fns';

import { asReviewPartitionsFromFlags } from './asReviewPartitionsFromFlags';
import { asReviewPartitionWarnLines } from './asReviewPartitionWarnLines';
import { getAllTargetsByPartition } from './getAllTargetsByPartition';

describe('asReviewPartitionWarnLines', () => {
  given('[case1] two partitions that share no file', () => {
    const split = getAllTargetsByPartition({
      targets: ['src/a.ts', 'src/b.ts'],
      partitions: asReviewPartitionsFromFlags({
        partition: ['a=src/a.ts', 'b=src/b.ts'],
      }),
      route: null,
    });

    when('[t0] the warn is checked', () => {
      then('it warns, never refuses — a caller may know better', () => {
        expect(asReviewPartitionWarnLines({ split }).join('\n')).toContain(
          'no file is common to two partitions',
        );
      });

      then('the lines match the snapshot', () => {
        const text = asReviewPartitionWarnLines({ split }).join('\n');
        expect(text).toContain('🟡 no file is common to two partitions');
        expect(text).toContain('add the overlap each side leans on');
        expect(text).toMatchSnapshot();
      });
    });
  });

  given('[case2] two partitions that share a file', () => {
    const split = getAllTargetsByPartition({
      targets: ['src/a.ts', 'src/types.ts'],
      partitions: asReviewPartitionsFromFlags({
        partition: ['a={src/a.ts,src/types.ts}', 'b=src/types.ts'],
      }),
      route: null,
    });

    when('[t0] the warn is checked', () => {
      then('there is none', () => {
        expect(asReviewPartitionWarnLines({ split })).toEqual([]);
      });
    });
  });

  given('[case3] one partition alone', () => {
    const split = getAllTargetsByPartition({
      targets: ['src/a.ts'],
      partitions: asReviewPartitionsFromFlags({ partition: ['a=src'] }),
      route: null,
    });

    when('[t0] the warn is checked', () => {
      then('there is none — one partition has no peer to share with', () => {
        expect(asReviewPartitionWarnLines({ split })).toEqual([]);
      });
    });
  });
});
