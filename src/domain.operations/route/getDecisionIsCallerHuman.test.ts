import { given, then, when } from 'test-fns';

import { getDecisionIsCallerHuman } from './getDecisionIsCallerHuman';

/**
 * .what = unit cases for the ONE actor check — the gate behind every *"human only"* lever
 * .why = 🔴 `route.mutate grant allow` mints a flag that lifts EVERY protected write on the
 *        route at once, a guard's `budget:` line among them. so a false positive here hands a
 *        clone the door the budget gate exists to shut, and it writes no passage row on the way
 *        through.
 */
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

  given('[case2] stdin is a pipe — node reports UNDEFINED, never false', () => {
    // the shape a tool harness actually produces. node leaves `isTTY` absent on a
    // non-tty stream, so this is the live case rather than the edge one.
    when('[t0] the actor is checked', () => {
      then('isHuman is false — the gate fails CLOSED', () => {
        const result = getDecisionIsCallerHuman({ isTTY: undefined });
        expect(result.isHuman).toBe(false);
      });

      // ⚠️ the guard against a refactor to `!!input.isTTY`. that form agrees here and reads
      //    as the same intent, so the contract is pinned to a boolean rather than to whichever
      //    falsy value node happened to hand over.
      then('isHuman is a boolean, never undefined', () => {
        const result = getDecisionIsCallerHuman({ isTTY: undefined });
        expect(typeof result.isHuman).toEqual('boolean');
      });
    });
  });
});
