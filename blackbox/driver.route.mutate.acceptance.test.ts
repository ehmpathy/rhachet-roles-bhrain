import * as fs from 'fs/promises';
import * as path from 'path';
import { given, then, useBeforeAll, useThen, when } from 'test-fns';

import {
  execAsync,
  genTempDirForRhachet,
  invokeRouteMutateGuard,
  invokeRouteSkill,
} from './.test/invokeRouteSkill';

const ASSETS_DIR = path.join(__dirname, '.test/assets/route-mutate');

/**
 * .what = route.mutate acceptance tests for route protection guard
 * .why = proves that protected paths are blocked and privilege system works
 */
describe('driver.route.mutate.acceptance', () => {
  given('[case1] bound route with no privilege', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDirForRhachet({
        slug: 'mutate-no-priv',
        clone: ASSETS_DIR,
      });

      // link the driver role
      await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });

      // create feature branch
      await execAsync('git checkout -b vlad/test-mutate', { cwd: tempDir });

      // bind the route
      await execAsync(
        'npx rhx route.bind.set --route .behavior/example',
        { cwd: tempDir },
      );

      return { tempDir };
    });

    when('[t0] guard blocks Read of *.stone', () => {
      const result = useThen('returns blocked', async () =>
        invokeRouteMutateGuard({
          cwd: scene.tempDir,
          stdin: {
            tool_name: 'Read',
            tool_input: {
              file_path: '.behavior/example/2.criteria.stone',
            },
          },
        }),
      );

      then('exit code is 2 (blocked)', () => {
        expect(result.code).toEqual(2);
      });

      then('stderr contains block message', () => {
        expect(result.stderr).toContain('blocked');
      });

      then('stderr contains focus guidance', () => {
        expect(result.stderr).toContain('route.drive');
      });

      then('guard output matches snapshot', () => {
        expect(result.stderr).toMatchSnapshot('guard blocks Read *.stone');
      });
    });

    when('[t1] guard blocks Read of *.guard', () => {
      const result = useThen('returns blocked', async () =>
        invokeRouteMutateGuard({
          cwd: scene.tempDir,
          stdin: {
            tool_name: 'Read',
            tool_input: {
              file_path: '.behavior/example/2.criteria.guard',
            },
          },
        }),
      );

      then('exit code is 2 (blocked)', () => {
        expect(result.code).toEqual(2);
      });

      then('guard output matches snapshot', () => {
        expect(result.stderr).toMatchSnapshot('guard blocks Read *.guard');
      });
    });

    when('[t2] guard allows Read of artifact', () => {
      const result = useThen('returns allowed', async () =>
        invokeRouteMutateGuard({
          cwd: scene.tempDir,
          stdin: {
            tool_name: 'Read',
            tool_input: {
              file_path: '.behavior/example/1.vision.md',
            },
          },
        }),
      );

      then('exit code is 0 (allowed)', () => {
        expect(result.code).toEqual(0);
      });

      then('guard output matches snapshot', () => {
        expect(result.stdout).toMatchSnapshot('guard allows artifact');
      });
    });

    when('[t3] guard blocks Bash cat on *.stone', () => {
      const result = useThen('returns blocked', async () =>
        invokeRouteMutateGuard({
          cwd: scene.tempDir,
          stdin: {
            tool_name: 'Bash',
            tool_input: {
              command: 'cat .behavior/example/2.criteria.stone',
            },
          },
        }),
      );

      then('exit code is 2 (blocked)', () => {
        expect(result.code).toEqual(2);
      });

      then('guard output matches snapshot', () => {
        expect(result.stderr).toMatchSnapshot('guard blocks Bash cat');
      });
    });

    when('[t4] guard blocks Write to .route/**', () => {
      const result = useThen('returns blocked', async () =>
        invokeRouteMutateGuard({
          cwd: scene.tempDir,
          stdin: {
            tool_name: 'Write',
            tool_input: {
              file_path: '.behavior/example/.route/passage.jsonl',
            },
          },
        }),
      );

      then('exit code is 2 (blocked)', () => {
        expect(result.code).toEqual(2);
      });

      then('guard output matches snapshot', () => {
        expect(result.stderr).toMatchSnapshot('guard blocks Write .route');
      });
    });

    when('[t5] block message matches snapshot', () => {
      const result = useThen('block result', async () =>
        invokeRouteMutateGuard({
          cwd: scene.tempDir,
          stdin: {
            tool_name: 'Read',
            tool_input: {
              file_path: '.behavior/example/2.criteria.stone',
            },
          },
        }),
      );

      then('stderr matches snapshot', () => {
        expect(result.stderr).toMatchSnapshot();
      });
    });
  });

  given('[case2] bound route with privilege', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDirForRhachet({
        slug: 'mutate-with-priv',
        clone: ASSETS_DIR,
      });

      // link the driver role
      await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });

      // create feature branch
      await execAsync('git checkout -b vlad/test-mutate', { cwd: tempDir });

      // bind the route
      await execAsync(
        'npx rhx route.bind.set --route .behavior/example',
        { cwd: tempDir },
      );

      // grant privilege
      await invokeRouteSkill({
        skill: 'route.mutate',
        args: { grant: 'allow' },
        cwd: tempDir,
      });

      return { tempDir };
    });

    when('[t0] guard allows Read of *.stone', () => {
      const result = useThen('returns allowed', async () =>
        invokeRouteMutateGuard({
          cwd: scene.tempDir,
          stdin: {
            tool_name: 'Read',
            tool_input: {
              file_path: '.behavior/example/2.criteria.stone',
            },
          },
        }),
      );

      then('exit code is 0 (allowed)', () => {
        expect(result.code).toEqual(0);
      });
    });
  });

  given('[case3] no bound route', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDirForRhachet({
        slug: 'mutate-no-bind',
        clone: ASSETS_DIR,
      });

      // link the driver role but DO NOT bind any route
      await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });
      await execAsync('git checkout -b vlad/test-mutate', { cwd: tempDir });

      return { tempDir };
    });

    when('[t0] guard allows Read of *.stone (no route = no protection)', () => {
      const result = useThen('returns allowed', async () =>
        invokeRouteMutateGuard({
          cwd: scene.tempDir,
          stdin: {
            tool_name: 'Read',
            tool_input: {
              file_path: '.behavior/example/2.criteria.stone',
            },
          },
        }),
      );

      then('exit code is 0 (allowed)', () => {
        expect(result.code).toEqual(0);
      });
    });
  });

  given('[case4] privilege management', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDirForRhachet({
        slug: 'mutate-priv-mgmt',
        clone: ASSETS_DIR,
      });

      // link the driver role
      await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });

      // create feature branch
      await execAsync('git checkout -b vlad/test-mutate', { cwd: tempDir });

      // bind the route
      await execAsync(
        'npx rhx route.bind.set --route .behavior/example',
        { cwd: tempDir },
      );

      return { tempDir };
    });

    when('[t0] grant get shows blocked', () => {
      const result = useThen('get privilege status', async () =>
        invokeRouteSkill({
          skill: 'route.mutate',
          args: { grant: 'get' },
          cwd: scene.tempDir,
        }),
      );

      then('status shows blocked', () => {
        expect(result.stdout).toContain('blocked');
      });

      then('exit code is 0', () => {
        expect(result.code).toEqual(0);
      });

      then('output matches snapshot', () => {
        expect(result.stdout).toMatchSnapshot('grant get - blocked');
      });
    });

    when('[t1] grant allow creates flag', () => {
      const result = useThen('grant privilege', async () => {
        const grantResult = await invokeRouteSkill({
          skill: 'route.mutate',
          args: { grant: 'allow' },
          cwd: scene.tempDir,
        });

        // check flag file
        const flagPath = path.join(
          scene.tempDir,
          '.behavior/example/.route/.privilege.mutate.flag',
        );
        const flagPresent = await fs
          .access(flagPath)
          .then(() => true)
          .catch(() => false);

        return { grantResult, flagPresent };
      });

      then('flag file is created', () => {
        expect(result.flagPresent).toBe(true);
      });

      then('output confirms grant', () => {
        expect(result.grantResult.stdout).toContain('granted');
      });

      then('output matches snapshot', () => {
        expect(result.grantResult.stdout).toMatchSnapshot('grant allow');
      });
    });

    when('[t2] grant get shows allowed', () => {
      const result = useThen('get privilege status', async () =>
        invokeRouteSkill({
          skill: 'route.mutate',
          args: { grant: 'get' },
          cwd: scene.tempDir,
        }),
      );

      then('status shows allowed', () => {
        expect(result.stdout).toContain('allowed');
      });

      then('output matches snapshot', () => {
        expect(result.stdout).toMatchSnapshot('grant get - allowed');
      });
    });

    when('[t3] grant block removes flag', () => {
      const result = useThen('revoke privilege', async () => {
        const revokeResult = await invokeRouteSkill({
          skill: 'route.mutate',
          args: { grant: 'block' },
          cwd: scene.tempDir,
        });

        // check flag file is absent
        const flagPath = path.join(
          scene.tempDir,
          '.behavior/example/.route/.privilege.mutate.flag',
        );
        const flagPresent = await fs
          .access(flagPath)
          .then(() => true)
          .catch(() => false);

        return { revokeResult, flagPresent };
      });

      then('flag file is absent', () => {
        expect(result.flagPresent).toBe(false);
      });

      then('output confirms revoke', () => {
        expect(result.revokeResult.stdout).toContain('revoked');
      });

      then('output matches snapshot', () => {
        expect(result.revokeResult.stdout).toMatchSnapshot('grant block');
      });
    });

    when('[t4] grant get shows blocked again', () => {
      const result = useThen('get privilege status', async () =>
        invokeRouteSkill({
          skill: 'route.mutate',
          args: { grant: 'get' },
          cwd: scene.tempDir,
        }),
      );

      then('status shows blocked', () => {
        expect(result.stdout).toContain('blocked');
      });
    });
  });

  given('[case5] audit log', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDirForRhachet({
        slug: 'mutate-audit',
        clone: ASSETS_DIR,
      });

      // link the driver role
      await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });

      // create feature branch
      await execAsync('git checkout -b vlad/test-mutate', { cwd: tempDir });

      // bind the route
      await execAsync(
        'npx rhx route.bind.set --route .behavior/example',
        { cwd: tempDir },
      );

      return { tempDir };
    });

    when('[t0] blocked access logs event', () => {
      const result = useThen('trigger block and check log', async () => {
        // trigger blocked access
        await invokeRouteMutateGuard({
          cwd: scene.tempDir,
          stdin: {
            tool_name: 'Read',
            tool_input: {
              file_path: '.behavior/example/2.criteria.stone',
            },
          },
        });

        // read audit log
        const logPath = path.join(
          scene.tempDir,
          '.behavior/example/.route/.guardrail.events.jsonl',
        );
        const logContent = await fs.readFile(logPath, 'utf-8');

        return { logContent };
      });

      then('log contains blocked verdict', () => {
        expect(result.logContent).toContain('"verdict":"blocked"');
      });

      then('log contains reason', () => {
        expect(result.logContent).toContain('"reason":"*.stone"');
      });

      then('log has no timestamp', () => {
        expect(result.logContent).not.toContain('"at":');
        expect(result.logContent).not.toContain('"timestamp":');
      });
    });
  });

  given('[case6] journey: blocked -> grant -> allowed -> revoke -> blocked', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDirForRhachet({
        slug: 'mutate-journey',
        clone: ASSETS_DIR,
      });

      // link the driver role
      await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });

      // create feature branch
      await execAsync('git checkout -b vlad/test-mutate', { cwd: tempDir });

      // bind the route
      await execAsync(
        'npx rhx route.bind.set --route .behavior/example',
        { cwd: tempDir },
      );

      return { tempDir };
    });

    when('[t0] journey executes sequentially', () => {
      then('completes full privilege cycle with snapshots', async () => {
        // phase 1a: check initial status - blocked
        const statusInitial = await invokeRouteSkill({
          skill: 'route.mutate',
          args: { grant: 'get' },
          cwd: scene.tempDir,
        });
        expect(statusInitial.code).toEqual(0);
        expect(statusInitial.stdout).toMatchSnapshot('phase 1a: grant get (blocked)');

        // phase 1b: blocked - capture full block experience
        const blocked = await invokeRouteMutateGuard({
          cwd: scene.tempDir,
          stdin: {
            tool_name: 'Read',
            tool_input: {
              file_path: '.behavior/example/2.criteria.stone',
            },
          },
        });
        expect(blocked.code).toEqual(2);
        expect(blocked.stderr).toMatchSnapshot('phase 1b: guard blocked');

        // phase 2: grant privilege - capture grant experience
        const grant = await invokeRouteSkill({
          skill: 'route.mutate',
          args: { grant: 'allow' },
          cwd: scene.tempDir,
        });
        expect(grant.code).toEqual(0);
        expect(grant.stdout).toMatchSnapshot('phase 2: grant allow');

        // phase 3a: check status - allowed
        const statusAllowed = await invokeRouteSkill({
          skill: 'route.mutate',
          args: { grant: 'get' },
          cwd: scene.tempDir,
        });
        expect(statusAllowed.code).toEqual(0);
        expect(statusAllowed.stdout).toMatchSnapshot('phase 3a: grant get (allowed)');

        // phase 3b: allowed - capture allowed experience
        const allowed = await invokeRouteMutateGuard({
          cwd: scene.tempDir,
          stdin: {
            tool_name: 'Read',
            tool_input: {
              file_path: '.behavior/example/2.criteria.stone',
            },
          },
        });
        expect(allowed.code).toEqual(0);
        expect(allowed.stdout).toMatchSnapshot('phase 3b: guard allowed');

        // phase 4: revoke privilege - capture revoke experience
        const revoke = await invokeRouteSkill({
          skill: 'route.mutate',
          args: { grant: 'block' },
          cwd: scene.tempDir,
        });
        expect(revoke.code).toEqual(0);
        expect(revoke.stdout).toMatchSnapshot('phase 4: grant block');

        // phase 5a: check status - blocked again
        const statusBlocked = await invokeRouteSkill({
          skill: 'route.mutate',
          args: { grant: 'get' },
          cwd: scene.tempDir,
        });
        expect(statusBlocked.code).toEqual(0);
        expect(statusBlocked.stdout).toMatchSnapshot('phase 5a: grant get (blocked again)');

        // phase 5b: blocked again - capture block experience
        const blockedAgain = await invokeRouteMutateGuard({
          cwd: scene.tempDir,
          stdin: {
            tool_name: 'Read',
            tool_input: {
              file_path: '.behavior/example/2.criteria.stone',
            },
          },
        });
        expect(blockedAgain.code).toEqual(2);
        expect(blockedAgain.stderr).toMatchSnapshot('phase 5b: guard blocked again');
      });
    });
  });
});
