import { given, then, when } from 'test-fns';

import { isToleratedIoWriteError } from './isToleratedIoWriteError';
import { TOLERATED_IO_WRITE_ERRNOS } from './TOLERATED_IO_WRITE_ERRNOS';

/**
 * .what = unit cases for isToleratedIoWriteError
 * .why = every reminder writer that tolerates an io fault asks this one question, so its contract
 *        is clamped here: a listed errno is tolerated, any other throw is not
 */
describe('isToleratedIoWriteError', () => {
  given('[case1] a host io fault', () => {
    when('[t0] its errno is on the tolerated list', () => {
      then('each listed errno is tolerated', () => {
        for (const code of TOLERATED_IO_WRITE_ERRNOS)
          expect(
            isToleratedIoWriteError({
              error: Object.assign(new Error(code), { code }),
            }),
          ).toEqual(true);
      });
    });

    when('[t1] its errno is off the list', () => {
      then('it is not tolerated', () => {
        expect(
          isToleratedIoWriteError({
            error: Object.assign(new Error('EBADF'), { code: 'EBADF' }),
          }),
        ).toEqual(false);
      });
    });
  });

  given('[case2] a throw that is no io fault', () => {
    when('[t0] it carries no errno', () => {
      then('a bug class (TypeError) is never tolerated', () => {
        expect(
          isToleratedIoWriteError({ error: new TypeError('x is undefined') }),
        ).toEqual(false);
      });

      then('a non-error throw is never tolerated', () => {
        expect(isToleratedIoWriteError({ error: 'EACCES' })).toEqual(false);
      });
    });
  });
});
