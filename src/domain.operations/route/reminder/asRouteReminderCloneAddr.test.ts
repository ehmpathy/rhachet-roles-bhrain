import { getError, given, then, when } from 'test-fns';

import { asRouteReminderCloneAddr } from './asRouteReminderCloneAddr';

/**
 * .what = unit-proves the `@:` sigil is the ONE canonical clone-addr shape --clone-addr accepts
 * .why = the value rides unchanged into sayToClone's `rhx clone say <addr>` call, so a bare
 *        serial here would reach rhx malformed. no synonym path — reject, name the fix.
 */
describe('asRouteReminderCloneAddr', () => {
  given('[case1] a raw value that already carries the @: sigil', () => {
    when('[t0] it is validated', () => {
      then('it passes through unchanged', () => {
        expect(asRouteReminderCloneAddr({ raw: '@:driver-1' })).toEqual(
          '@:driver-1',
        );
      });
    });
  });

  given('[case2] a bare serial with no sigil', () => {
    when('[t0] it is validated', () => {
      then('it throws a constraint error that names the @: fix', async () => {
        const error = await getError(
          Promise.resolve().then(() =>
            asRouteReminderCloneAddr({ raw: 'driver-1' }),
          ),
        );
        expect(error.message).toContain("did you mean '@:driver-1'?");
      });
    });
  });
});
