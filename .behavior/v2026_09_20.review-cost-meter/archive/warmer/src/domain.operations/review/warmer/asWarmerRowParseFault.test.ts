import { given, then, when } from 'test-fns';

import { ReviewRunArtifactError } from '@src/domain.operations/review/ReviewRunArtifactError';
import { NAME_OF_WARMER_ROWS } from '@src/domain.operations/review/warmer/setOneWarmerPokeRow';

import { asWarmerRowParseFault } from './asWarmerRowParseFault';

/**
 * .what = a real SyntaxError, thrown by the real parser over a torn row
 */
const genSyntaxErrorOfTornRow = (): unknown => {
  try {
    return JSON.parse('{"at":');
  } catch (error) {
    return error;
  }
};

describe('asWarmerRowParseFault', () => {
  given('[case1] a SyntaxError from a torn row', () => {
    when('[t0] classified', () => {
      const fault = asWarmerRowParseFault({
        error: genSyntaxErrorOfTornRow(),
        dir: '/run',
        row: 3,
      });

      then('it becomes a ReviewRunArtifactError', () => {
        expect(fault).toBeInstanceOf(ReviewRunArtifactError);
      });

      then('it names the ledger file and the row', () => {
        expect(String(fault)).toContain(NAME_OF_WARMER_ROWS);
        expect(
          (fault as ReviewRunArtifactError).metadata, // narrowed by the instance check above
        ).toMatchObject({ file: NAME_OF_WARMER_ROWS, row: 3, dir: '/run' });
      });
    });
  });

  given('[case2] a RangeError from the engine', () => {
    when('[t0] classified', () => {
      const error = new RangeError('Maximum call stack size exceeded');
      const fault = asWarmerRowParseFault({ error, dir: '/run', row: 3 });

      then('🔴 it surfaces as itself, never renamed as a torn row', () => {
        expect(fault).toBe(error);
        expect(fault).not.toBeInstanceOf(ReviewRunArtifactError);
      });
    });
  });
});
