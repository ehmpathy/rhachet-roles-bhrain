import { given, then, when } from 'test-fns';

import { asStoneGuardCounter } from './asStoneGuardCounter';

describe('asStoneGuardCounter', () => {
  given('[case1] single-digit counters', () => {
    when('[t0] value is 1', () => {
      then('pads to width 3', () => {
        expect(asStoneGuardCounter({ value: 1 })).toEqual('001');
      });
    });
  });

  given('[case2] double-digit counters', () => {
    when('[t0] value is 10', () => {
      then('pads to width 3 and sorts after 002 lexically', () => {
        expect(asStoneGuardCounter({ value: 10 })).toEqual('010');
        expect('010' > '002').toBe(true);
      });
    });
  });

  given('[case3] value already at or beyond width', () => {
    when('[t0] value is 100', () => {
      then('renders unpadded', () => {
        expect(asStoneGuardCounter({ value: 100 })).toEqual('100');
      });
    });

    when('[t1] value is 1000 (beyond width)', () => {
      then('is not truncated (parseInt still recovers it)', () => {
        expect(asStoneGuardCounter({ value: 1000 })).toEqual('1000');
        expect(parseInt(asStoneGuardCounter({ value: 1000 }), 10)).toEqual(
          1000,
        );
      });
    });
  });
});
