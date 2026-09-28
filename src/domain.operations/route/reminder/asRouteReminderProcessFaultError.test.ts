import { BadRequestError } from 'helpful-errors';
import { given, then, when } from 'test-fns';

import { asRouteReminderProcessFaultError } from './asRouteReminderProcessFaultError';

describe('asRouteReminderProcessFaultError', () => {
  given('an EPERM fault — the pid-reuse residual', () => {
    const error = Object.assign(new Error('kill EPERM'), { code: 'EPERM' });

    when('mapped', () => {
      const mapped = asRouteReminderProcessFaultError({
        error,
        route: '.behavior/my-feature',
        cloneAddr: '@:driver-1',
      });

      then('it becomes a BadRequestError (exit 2 constraint)', () => {
        expect(mapped).toBeInstanceOf(BadRequestError);
      });

      then('its message names the EPERM cause', () => {
        expect((mapped as Error).message).toContain('EPERM');
      });

      then('its hint names the concrete fix — remove the stale handle', () => {
        // the hint must state the exact rm of the stale pid handle so the human clears it in one move
        expect((mapped as Error).message).toContain('rm ');
        expect((mapped as Error).message).toContain('.pid');
      });
    });
  });

  given('a non-EPERM errno (EINVAL) — not the residual', () => {
    const error = Object.assign(new Error('kill EINVAL'), { code: 'EINVAL' });

    when('mapped', () => {
      const mapped = asRouteReminderProcessFaultError({
        error,
        route: '.behavior/my-feature',
        cloneAddr: '@:driver-1',
      });

      then('it passes the original error through unchanged', () => {
        expect(mapped).toBe(error);
      });
    });
  });

  given('an error with no errno code — not the residual', () => {
    const error = new Error('some unrelated failure');

    when('mapped', () => {
      const mapped = asRouteReminderProcessFaultError({
        error,
        route: '.behavior/my-feature',
        cloneAddr: '@:driver-1',
      });

      then('it passes the original error through unchanged', () => {
        expect(mapped).toBe(error);
      });
    });
  });
});
