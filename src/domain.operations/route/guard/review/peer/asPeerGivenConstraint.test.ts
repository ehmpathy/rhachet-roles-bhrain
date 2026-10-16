import { given, then, when } from 'test-fns';

import { HEADLINE_OF_REVIEW_OVERFLOW } from '@src/domain.operations/review/ReviewOverflowRefusedError';

import { asPeerGivenConstraint } from './asPeerGivenConstraint';

/**
 * .what = an overflow refusal, as the guard writes it into a given — stderr nested in tree glyphs
 */
const CONTENT_OVERFLOW = [
  '├─ stderr',
  '│  │  ✋ ConstraintError: prompt exceeds 75% of context window',
  '│  │     ├─ lever',
  '│  │     │  ├─ declare partitions, so each one fits, e.g.:',
  "│  │     │  │  --partition 'beta={src/beta/**,.behavior/demo/**}'",
  "│  │     │  │  --partition 'alpha={src/alpha/**,.behavior/demo/**}'",
  "│  │     │  └─ hint: declare one or more with --partition '<slug>=<globs>'",
  '│  │  ✋ ConstraintError: prompt exceeds 75% of context window',
  "│  │  --partition 'beta={src/beta/**,.behavior/demo/**}'",
  '└─ passage blocked',
].join('\n');

describe('asPeerGivenConstraint', () => {
  given('[case1] a given that holds an overflow refusal', () => {
    when('[t0] it is read', () => {
      const constraint = asPeerGivenConstraint({ content: CONTENT_OVERFLOW });

      then('it names the cause', () => {
        expect(constraint?.cause).toEqual(
          'prompt exceeds 75% of context window',
        );
      });

      then('it marks the refusal an overflow', () => {
        expect(constraint?.overflowed).toEqual(true);
      });

      then(
        'it names each proposed partition once, in order, and no placeholder',
        () => {
          expect(constraint?.partitions).toEqual([
            'beta={src/beta/**,.behavior/demo/**}',
            'alpha={src/alpha/**,.behavior/demo/**}',
          ]);
        },
      );
    });
  });

  given('[case2] a given that holds a malfunction, no refusal', () => {
    when('[t0] it is read', () => {
      then('it is no constraint', () => {
        expect(
          asPeerGivenConstraint({
            content: '💥 MalfunctionError: review timed out after 20 minutes',
          }),
        ).toEqual(null);
      });
    });
  });

  given('[case3] a refusal that is no overflow', () => {
    when('[t0] it is read', () => {
      // 🔴 only an overflow is cured by a partition; every other refusal must read as such
      then('it names the cause, marks no overflow, and an empty set', () => {
        expect(
          asPeerGivenConstraint({
            content: '✋ ConstraintError: absent api key',
          }),
        ).toEqual({
          cause: 'absent api key',
          overflowed: false,
          partitions: [],
        });
      });
    });
  });

  given('[case4] the overflow headline its writer prints', () => {
    when('[t0] it is read back', () => {
      // the writer and the reader share one constant, so a reword cannot split them
      then('it reads as an overflow', () => {
        expect(
          asPeerGivenConstraint({
            content: `✋ ConstraintError: ${HEADLINE_OF_REVIEW_OVERFLOW}`,
          })?.overflowed,
        ).toEqual(true);
      });
    });
  });
});
