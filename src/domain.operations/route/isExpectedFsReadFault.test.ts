import { given, then, when } from 'test-fns';

import { isExpectedFsReadFault } from './isExpectedFsReadFault';

describe('isExpectedFsReadFault', () => {
  given('an error that carries a real fs code', () => {
    when('[t0] the code is ENOENT', () => {
      then('it is a benign read fault', () => {
        const error = Object.assign(new Error('boom'), { code: 'ENOENT' });
        expect(isExpectedFsReadFault(error)).toBe(true);
      });
    });

    when('[t1] the code is EACCES', () => {
      then('it is a benign read fault', () => {
        const error = Object.assign(new Error('boom'), { code: 'EACCES' });
        expect(isExpectedFsReadFault(error)).toBe(true);
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
          expect(isExpectedFsReadFault(error)).toBe(false);
        });
      });

      when('[t1] the error has no code at all, only the message', () => {
        then('it is NOT a benign read fault', () => {
          const error = new Error(
            'ENOENT appears in this message but is no fs fault',
          );
          expect(isExpectedFsReadFault(error)).toBe(false);
        });
      });
    },
  );

  given('a non-error value', () => {
    when('[t0] a plain string', () => {
      then('it is NOT a benign read fault', () => {
        expect(isExpectedFsReadFault('ENOENT')).toBe(false);
      });
    });
  });
});
