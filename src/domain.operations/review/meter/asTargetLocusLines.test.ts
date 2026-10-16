import { given, then, when } from 'test-fns';

import { asCountHuman } from '@src/domain.operations/review/asCountHuman';
import {
  asFigureHuman,
  MARK_OF_ABSENT,
  WORD_OF_ABSENT,
} from '@src/domain.operations/review/meter/asFigureHuman';
import { asTargetLocusLines } from '@src/domain.operations/review/meter/asTargetLocusLines';

describe('asTargetLocusLines', () => {
  given('[case1] a locus whose targets carry chars', () => {
    when('[t0] it is rendered', () => {
      const lines = asTargetLocusLines({
        targets: [
          { path: 'src/a/b/c.ts', chars: 800 },
          { path: 'blackbox/d.ts', chars: 200 },
        ],
        limit: 10,
        head: '   ├─ ',
        gutter: '   │  ',
        suffix: '',
        figure: asFigureHuman,
        absent: MARK_OF_ABSENT,
        detail: null,
      });

      then('each row carries its measured share', () => {
        expect(lines[1]).toContain('80.0%');
        expect(lines[2]).toContain('20.0%');
      });

      then('the lines match the snapshot', () => {
        expect(lines.join('\n')).toContain('80.0%');
        expect(lines.join('\n')).toMatchSnapshot();
      });
    });
  });

  given('[case2] a locus whose every target measured zero chars', () => {
    when('[t0] it is rendered', () => {
      const lines = asTargetLocusLines({
        targets: [
          { path: 'src/a/b/c.ts', chars: 0 },
          { path: 'src/a/b/d.ts', chars: 0 },
        ],
        limit: 10,
        head: '   ├─ ',
        gutter: '   │  ',
        suffix: '',
        figure: asFigureHuman,
        absent: MARK_OF_ABSENT,
        detail: null,
      });

      then(
        '🔴 the row prints the absent mark, never 0.0% and never NaN%',
        () => {
          expect(lines[1]).toContain(MARK_OF_ABSENT);
          expect(lines[1]).not.toContain('0.0%');
          expect(lines[1]).not.toContain('NaN');
        },
      );

      then('the lines match the snapshot', () => {
        expect(lines.join('\n')).toContain(MARK_OF_ABSENT);
        expect(lines.join('\n')).toMatchSnapshot();
      });
    });
  });

  given(
    '[case3] the census breadth renders with full separators and its WORD of absence',
    () => {
      when('[t0] the figures are large and every target measured zero', () => {
        const large = asTargetLocusLines({
          targets: [{ path: 'src/a/b/c.ts', chars: 12_000 }],
          limit: 10,
          head: '   ├─ ',
          gutter: '   │  ',
          suffix: '',
          figure: asCountHuman,
          absent: WORD_OF_ABSENT,
          detail: null,
        });
        const zero = asTargetLocusLines({
          targets: [{ path: 'src/a/b/c.ts', chars: 0 }],
          limit: 10,
          head: '   ├─ ',
          gutter: '   │  ',
          suffix: '',
          figure: asCountHuman,
          absent: WORD_OF_ABSENT,
          detail: null,
        });

        then(
          "🔴 the figure renders at the caller's scale, never scaled",
          () => {
            expect(large.join('\n')).toContain('12,000 chars');
            expect(large.join('\n')).not.toContain('12.0k');
          },
        );

        then(
          "🔴 a share over a zero total reads the caller's word, never the run's mark",
          () => {
            expect(zero[1]).toContain(WORD_OF_ABSENT);
            expect(zero[1]).not.toContain(MARK_OF_ABSENT);
          },
        );

        then('the lines match the snapshot', () => {
          const both = [...large, '', ...zero].join('\n');
          expect(both).toContain('12,000 chars');
          expect(both).toContain(WORD_OF_ABSENT);
          expect(both).toMatchSnapshot();
        });
      });
    },
  );
});
