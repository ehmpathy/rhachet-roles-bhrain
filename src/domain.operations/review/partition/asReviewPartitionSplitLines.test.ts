import { given, then, when } from 'test-fns';

import { asReviewPartitionSplitLines } from './asReviewPartitionSplitLines';

describe('asReviewPartitionSplitLines', () => {
  given('[case1] one declared partition that holds one narrow target', () => {
    const lines = asReviewPartitionSplitLines({
      partitions: [{ name: 'logic', narrow: ['src/logic/a.ts'], common: [] }],
      commonToEvery: [],
    });

    when('[t0] the split is announced', () => {
      then(
        '🔴 it never claims a prime, since no file is common to every partition',
        () => {
          const text = lines.join('\n');
          expect(text).not.toContain('primed');
          expect(text).toContain(
            'poured at once (no file is common to every partition, so no prime)',
          );
        },
      );

      then('each count agrees with its noun — never `1 targets`', () => {
        const text = lines.join('\n');
        expect(text).toContain('split into 1 declared partition');
        expect(text).toContain('logic: 1 narrow target + 0 common targets');
        expect(text).not.toContain('1 narrow targets');
        expect(text).not.toContain('1 declared partitions');
      });

      then('the lines match the snapshot', () => {
        const text = lines.join('\n');
        expect(text).toContain('└─ logic: 1 narrow target + 0 common targets');
        expect(text).toMatchSnapshot();
      });
    });
  });

  given('[case2] two partitions that share common targets', () => {
    const lines = asReviewPartitionSplitLines({
      partitions: [
        {
          name: 'review',
          narrow: ['src/review/a.ts', 'src/review/b.ts'],
          common: ['src/domain.objects/Stone.ts'],
        },
        {
          name: 'route',
          narrow: ['src/route/c.ts'],
          common: ['src/domain.objects/Stone.ts'],
        },
      ],
      commonToEvery: ['src/domain.objects/Stone.ts'],
    });

    when('[t0] the split is announced', () => {
      then(
        'it names the prime, since a file is common to every partition',
        () => {
          expect(lines.join('\n')).toContain('primed, then poured at once');
        },
      );

      then('each partition names its narrow and common counts', () => {
        const text = lines.join('\n');
        expect(text).toContain('split into 2 declared partitions');
        expect(text).toContain('review: 2 narrow targets + 1 common target');
        expect(text).toContain('route: 1 narrow target + 1 common target');
      });

      then('the lines match the snapshot', () => {
        const text = lines.join('\n');
        expect(text).toContain('├─ review: 2 narrow targets + 1 common target');
        expect(text).toContain('└─ route: 1 narrow target + 1 common target');
        expect(text).toMatchSnapshot();
      });
    });
  });
});
