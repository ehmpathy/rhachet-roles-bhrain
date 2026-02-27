import { given, then, when } from 'test-fns';

import { getDecisionIsCallerHuman } from './getDecisionIsCallerHuman';

describe('getDecisionIsCallerHuman', () => {
  given('[case1] TTY detection', () => {
    when('[t0] isTTY is true', () => {
      then('isHuman is true', () => {
        const result = getDecisionIsCallerHuman({ isTTY: true });
        expect(result.isHuman).toBe(true);
      });
    });

    when('[t1] isTTY is false', () => {
      then('isHuman is false', () => {
        const result = getDecisionIsCallerHuman({ isTTY: false });
        expect(result.isHuman).toBe(false);
      });
    });
  });
});
