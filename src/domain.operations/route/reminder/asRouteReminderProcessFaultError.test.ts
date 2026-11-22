import { BadRequestError } from 'helpful-errors';
import { given, then, when } from 'test-fns';

import { asRouteReminderProcessFaultError } from './asRouteReminderProcessFaultError';
import { RouteReminderPidMalformedError } from './RouteReminderPidMalformedError';

describe('asRouteReminderProcessFaultError', () => {
  given('an EPERM fault — the pid-reuse residual', () => {
    const error = Object.assign(new Error('kill EPERM'), { code: 'EPERM' });

    when('mapped', () => {
      const mapped = asRouteReminderProcessFaultError({
        error,
        repoRoot: '/tmp/repo-x',
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

  given('a torn clone handle — its body is not a pid', () => {
    const error = new RouteReminderPidMalformedError(
      'RouteReminder pid file is malformed',
      { pidPath: '/tmp/repo-x/x.pid', raw: '12x' },
    );

    when('mapped', () => {
      const mapped = asRouteReminderProcessFaultError({
        error,
        repoRoot: '/tmp/repo-x',
        cloneAddr: '@:driver-1',
      });

      then('it becomes a BadRequestError (exit 2 constraint)', () => {
        expect(mapped).toBeInstanceOf(BadRequestError);
      });

      then('it names the torn handle and the one verb that clears it', () => {
        expect((mapped as Error).message).toContain('torn');
        expect((mapped as Error).message).toContain('rhx route.reminder.del');
        expect((mapped as Error).message).toContain('.pid');
      });
    });
  });

  given('a non-EPERM errno (EINVAL) — not the residual', () => {
    const error = Object.assign(new Error('kill EINVAL'), { code: 'EINVAL' });

    when('mapped', () => {
      const mapped = asRouteReminderProcessFaultError({
        error,
        repoRoot: '/tmp/repo-x',
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
        repoRoot: '/tmp/repo-x',
        cloneAddr: '@:driver-1',
      });

      then('it passes the original error through unchanged', () => {
        expect(mapped).toBe(error);
      });
    });
  });
});
