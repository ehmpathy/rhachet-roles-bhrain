import { given, then, when } from 'test-fns';

import { asWarmerEndStampFault } from './asWarmerEndStampFault';

/**
 * .what = an error shaped as node's fs rejection, with the given errno
 * .why = a refused write is the watermark fault the end stamp may let lapse
 */
const asFsError = (code: string): Error =>
  Object.assign(new Error(`${code}: fs refused`), { code });

describe('asWarmerEndStampFault', () => {
  given('[case1] the stamp met a watermark fault', () => {
    when('[t0] the life ended clean', () => {
      then('the fault lapses', () => {
        expect(
          asWarmerEndStampFault({
            stampFault: asFsError('ENOSPC'),
            life: null,
          }),
        ).toEqual(null);
      });
    });

    when('[t1] the life faulted', () => {
      then('the fault lapses, and the life fault stands alone', () => {
        expect(
          asWarmerEndStampFault({
            stampFault: asFsError('EROFS'),
            life: { fault: new Error('poke loop broke') },
          }),
        ).toEqual(null);
      });
    });
  });

  given('[case2] the stamp met a defect, not a watermark fault', () => {
    const stampFault = new TypeError('cannot read properties of undefined');

    when('[t0] the life ended clean', () => {
      then('the stamp fault is thrown as itself', () => {
        const thrown = asWarmerEndStampFault({ stampFault, life: null });
        expect(thrown?.fault).toBe(stampFault);
      });
    });

    when('[t1] the life faulted', () => {
      const lifeFault = new Error('poke loop broke');
      const thrown = asWarmerEndStampFault({
        stampFault,
        life: { fault: lifeFault },
      });

      then('the stamp fault is thrown, never swallowed', () => {
        expect(thrown).not.toEqual(null);
        expect(thrown?.fault).toBeInstanceOf(Error);
      });

      then('the thrown error names the stamp fault', () => {
        expect(String(thrown?.fault)).toContain(
          'cannot read properties of undefined',
        );
      });

      then('the life fault is chained as its cause, never masked', () => {
        expect(thrown?.fault).toHaveProperty('cause', lifeFault);
      });
    });

    when('[t2] the life faulted with a non-error value', () => {
      const thrown = asWarmerEndStampFault({
        stampFault,
        life: { fault: 'a thrown string' },
      });

      then('the life fault still rides as the cause, by its message', () => {
        expect(thrown?.fault).toHaveProperty(
          'cause.message',
          'a thrown string',
        );
      });
    });
  });
});
