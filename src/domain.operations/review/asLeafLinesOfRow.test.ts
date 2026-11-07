import { given, then, when } from 'test-fns';

import { asLeafLinesOfRow } from './asLeafLinesOfRow';

describe('asLeafLinesOfRow', () => {
  given('[case1] a row with peers below it', () => {
    when('[t0] it hangs two leaves', () => {
      const lines = asLeafLinesOfRow({
        indent: '   ',
        isLastRow: false,
        leaves: ['cached: 5%', 'pairs: 3 served'],
      });

      then(
        'the row stem runs beside each leaf, and the last leaf closes',
        () => {
          expect(lines).toEqual([
            '   │  ├─ cached: 5%',
            '   │  └─ pairs: 3 served',
          ]);
        },
      );
    });
  });

  given('[case2] the last row of its branch', () => {
    when('[t0] it hangs one leaf', () => {
      const lines = asLeafLinesOfRow({
        indent: '   ',
        isLastRow: true,
        leaves: ['pairs: 3 served'],
      });

      then('no stem runs beside the leaf', () => {
        expect(lines).toEqual(['      └─ pairs: 3 served']);
      });
    });
  });

  given('[case3] a row with no leaves', () => {
    when('[t0] it is rendered', () => {
      then('it hangs naught', () => {
        expect(
          asLeafLinesOfRow({ indent: '   ', isLastRow: false, leaves: [] }),
        ).toEqual([]);
      });
    });
  });
});
