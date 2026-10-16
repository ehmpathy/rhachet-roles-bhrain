import { MalfunctionError } from 'helpful-errors';
import { getError, given, then, when } from 'test-fns';

import { asWatermarkFaultOrThrow } from './asWatermarkFaultOrThrow';

describe('asWatermarkFaultOrThrow', () => {
  given('[case1] a watermark store fault', () => {
    when('[t0] it is classified', () => {
      const error = new MalfunctionError(
        'withSimpleMutex: the cache backend faulted while it acquired the lock',
        { cause: new Error('EEXIST: file already exists, mkdir') },
      );

      then('it returns the fault, never throws', () => {
        const result = asWatermarkFaultOrThrow(error);
        expect(result.fault).toContain('withSimpleMutex');
      });
    });
  });

  given('[case2] a defect of any other origin', () => {
    when('[t0] it is classified', () => {
      const error = new MalfunctionError(
        'the review prompt could not be compiled',
      );

      then('it rethrows the error itself', async () => {
        const thrown = await getError(async () =>
          asWatermarkFaultOrThrow(error),
        );
        expect(thrown).toBe(error);
      });
    });
  });
});
