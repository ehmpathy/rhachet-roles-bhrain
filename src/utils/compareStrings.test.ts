import { given, then, when } from 'test-fns';

import { compareStrings } from './compareStrings';

describe('compareStrings', () => {
  given('[case1] paths that a locale collation would reorder', () => {
    when('[t0] they are sorted', () => {
      const sorted = ['src/b.ts', 'src/B.ts', 'src/a-b.ts', 'src/a/b.ts'].sort(
        compareStrings,
      );

      // code-unit order: 'B' (0x42) precedes 'a' (0x61), and '-' (0x2d) precedes '/' (0x2f),
      // which an icu collation does not guarantee — so one range orders one way on any host
      then('the order is code-unit, never locale', () => {
        expect(sorted).toEqual([
          'src/B.ts',
          'src/a-b.ts',
          'src/a/b.ts',
          'src/b.ts',
        ]);
      });
    });
  });

  given('[case2] two equal strings', () => {
    when('[t0] they are compared', () => {
      then('the verdict is zero', () => {
        expect(compareStrings('src/a.ts', 'src/a.ts')).toEqual(0);
      });
    });
  });
});
