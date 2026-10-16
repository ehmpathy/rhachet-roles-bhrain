import { ConstraintError, getError } from 'helpful-errors';
import { given, then, when } from 'test-fns';

import { getOneRouteGuardPartitionsCheck } from './getOneRouteGuardPartitionsCheck';

/**
 * .what = the empty-set refusal, which fires before any file is read
 * .why = every other partition refusal names its route and a paste-ready command, so this one
 *        must too, or a driver who reaches it cannot tell which route failed nor what to run
 */
describe('getOneRouteGuardPartitionsCheck', () => {
  given('[case1] a declaration with no partition at all', () => {
    when('[t0] the check runs under the @all scope', () => {
      then(
        'it refuses, and names the route and the command to run',
        async () => {
          const error = await getError(
            getOneRouteGuardPartitionsCheck({
              partition: [],
              route: '.behavior/v2026_01_01.demo',
              cwd: '/nonexistent',
              repairOf: null,
            }),
          );
          expect(error).toBeInstanceOf(ConstraintError);
          expect(error.message).toContain('.behavior/v2026_01_01.demo');
          expect(error.message).toContain(
            'rhx route.guard.partition --route .behavior/v2026_01_01.demo --for review --peer @all',
          );
          expect(error.message).toContain("--partition '<slug>=<globs>'");
          expect(error.message).toContain('--mode apply');

          // the whole refusal, byte for byte: the fragments above pin the invariants, the
          // snapshot pins the shape around them
          expect(error.message).toMatchSnapshot();
        },
      );
    });

    when('[t1] the check runs under one reviewer scope', () => {
      then('the command names that reviewer and stone', async () => {
        const error = await getError(
          getOneRouteGuardPartitionsCheck({
            partition: [],
            route: '.behavior/v2026_01_01.demo',
            cwd: '/nonexistent',
            repairOf: { kind: 'peer', stone: '5.1.execution', peer: 'primo' },
          }),
        );
        expect(error.message).toContain('--peer primo --stone 5.1.execution');
        expect(error.message).toMatchSnapshot();
      });
    });
  });
});
