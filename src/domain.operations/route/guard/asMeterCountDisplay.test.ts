import { given, then, when } from 'test-fns';

import { asMeterCountDisplay } from './asMeterCountDisplay';

describe('asMeterCountDisplay', () => {
  // 🔴 the clamp for r10.n4 — an unlimited budget is stored as Infinity, and the pre-fix
  //    surfaces rendered it via String(Infinity), which reads to a driver as the literal
  //    'Infinity'. it now reads '∞'.
  given('an unlimited budget stored as Infinity', () => {
    when('[t0] rendered for display', () => {
      then('it reads ∞, never the literal Infinity', () => {
        expect(asMeterCountDisplay(Infinity)).toBe('∞');
        expect(asMeterCountDisplay(Infinity)).not.toBe('Infinity');
      });
    });
  });

  given('a finite count', () => {
    when('[t0] a positive integer', () => {
      then('it reads the number', () => {
        expect(asMeterCountDisplay(4)).toBe('4');
      });
    });

    when('[t1] zero', () => {
      then('it reads 0', () => {
        expect(asMeterCountDisplay(0)).toBe('0');
      });
    });
  });

  // 🔴 the clamp for r009 nitpick.2 — the paired guard on the stance ack's tail
  //    (asReviewerMeterLine) tests `!Number.isFinite(count)`, so -Infinity and NaN must read '∞'
  //    here too, or the cell and the tail disagree on the same value. pre-fix, these fell
  //    through to `String(count)` ('-Infinity' / 'NaN').
  given('a non-finite count that is not positive Infinity', () => {
    when('[t0] -Infinity', () => {
      then('it reads ∞, never the literal -Infinity', () => {
        expect(asMeterCountDisplay(-Infinity)).toBe('∞');
      });
    });

    when('[t1] NaN', () => {
      then('it reads ∞, never the literal NaN', () => {
        expect(asMeterCountDisplay(NaN)).toBe('∞');
      });
    });
  });
});
