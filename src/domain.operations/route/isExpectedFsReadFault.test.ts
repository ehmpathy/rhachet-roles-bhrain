import { given, then, when } from 'test-fns';

import { isErrorOfAbsence } from '@src/utils/fs/isErrorOfAbsence';
import { isErrorOfDenial } from '@src/utils/fs/isErrorOfDenial';

import { isExpectedFsReadFault } from './isExpectedFsReadFault';

describe('isExpectedFsReadFault', () => {
  given('an error that carries a real fs code', () => {
    when('[t0] the code is ENOENT', () => {
      then('it is a benign read fault', () => {
        const error = Object.assign(new Error('boom'), { code: 'ENOENT' });
        expect(isExpectedFsReadFault({ error })).toBe(true);
      });
    });

    when('[t1] the code is EACCES', () => {
      then('it is a benign read fault', () => {
        const error = Object.assign(new Error('boom'), { code: 'EACCES' });
        expect(isExpectedFsReadFault({ error })).toBe(true);
      });
    });

    // 🔴 the clamp: the code set is built from the shared absence + denial allowlists, so
    //    EPERM — a denial per `isErrorOfDenial` — reads the same here as there
    when('[t2] the code is EPERM, a denial per the shared allowlist', () => {
      then('it is a benign read fault, consistent with isErrorOfDenial', () => {
        const error = Object.assign(new Error('boom'), { code: 'EPERM' });
        expect(isErrorOfDenial({ error })).toBe(true);
        expect(isExpectedFsReadFault({ error })).toBe(true);
      });
    });

    when(
      '[t3] the code is ENOTDIR, an absence per the shared allowlist',
      () => {
        then(
          'it is a benign read fault, consistent with isErrorOfAbsence',
          () => {
            const error = Object.assign(new Error('boom'), { code: 'ENOTDIR' });
            expect(isErrorOfAbsence({ error })).toBe(true);
            expect(isExpectedFsReadFault({ error })).toBe(true);
          },
        );
      },
    );

    when('[t4] the code is one of the read-only extras', () => {
      then(
        'EISDIR, ELOOP, and ENAMETOOLONG are each a benign read fault',
        () => {
          const verdicts = ['EISDIR', 'ELOOP', 'ENAMETOOLONG'].map((code) =>
            isExpectedFsReadFault({
              error: Object.assign(new Error('boom'), { code }),
            }),
          );
          expect(verdicts).toEqual([true, true, true]);
        },
      );
    });

    when('[t5] the code is an fs fault outside every list', () => {
      then('EIO is NOT a benign read fault', () => {
        const error = Object.assign(new Error('boom'), { code: 'EIO' });
        expect(isExpectedFsReadFault({ error })).toBe(false);
      });
    });

    when('[t6] the error comes from another realm', () => {
      then('it is a benign read fault — the code is the gate', () => {
        // a cross-realm fs error is an object with a code, never `instanceof Error` here
        const error = { message: 'no such file', code: 'ENOENT' };
        expect(isExpectedFsReadFault({ error })).toBe(true);
      });
    });
  });

  // 🔴 the clamp for r10.n5 — the pre-fix body read `error.message.includes('ENOENT')`,
  //    so a REAL defect whose message merely quoted a path with the text 'ENOENT' in it
  //    was swallowed as benign. keyed on `error.code`, it is now rethrown.
  given(
    'a real defect whose MESSAGE quotes an fs code but whose code does not match',
    () => {
      when('[t0] the message contains the text ENOENT', () => {
        then('it is NOT a benign read fault', () => {
          const error = Object.assign(
            new Error('failed to parse /var/ENOENT-report/output.json'),
            { code: 'BAD_STATE' },
          );
          expect(isExpectedFsReadFault({ error })).toBe(false);
        });
      });

      when('[t1] the error has no code at all, only the message', () => {
        then('it is NOT a benign read fault', () => {
          const error = new Error(
            'ENOENT appears in this message but is no fs fault',
          );
          expect(isExpectedFsReadFault({ error })).toBe(false);
        });
      });
    },
  );

  given('a non-error value', () => {
    when('[t0] a plain string', () => {
      then('it is NOT a benign read fault', () => {
        expect(isExpectedFsReadFault({ error: 'ENOENT' })).toBe(false);
      });
    });
  });
});
