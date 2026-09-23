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

const FLAG_PATH = '.behavior/example/.route/.privilege.mutate.flag';

/**
 * .what = places the privilege flag the way a HUMAN's `grant allow` would
 * .why = 🔴 `rhx route.mutate grant allow` is human only, and the check is a tty probe. a test
 *        spawns the skill with a pipe on stdin, so it is refused by construction — correctly, and
 *        that refusal is its OWN subject ([case4] [t1] below).
 *
 *        ⇒ every OTHER case here needs the flag merely as a precondition, so it writes what a
 *          human's grant writes rather than a lever it cannot legitimately pull. a test that
 *          reached for a `__I_AM_HUMAN`-shaped hatch would hand the bot the very door the gate
 *          exists to shut.
 *
 * 🔴 .what this stand-in does and does NOT stand in for, named here rather than left to notice.
 *    the chain is `TTY → getDecisionIsCallerHuman → flag minted → protected write allowed`, and
 *    ALL FOUR links are now clamped:
 *
 *    | link | proven where |
 *    |---|---|
 *    | a non-tty caller is refused | ✅ live — `[case4] [t1]`, exit 2 + the refusal copy |
 *    | `isTTY` decides, and `undefined` is not `true` | ✅ unit — `getDecisionIsCallerHuman.test.ts` |
 *    | a flag present lifts the protected write | ✅ live — `[case2] [t0]`, and `[case5]` phase 3b |
 *    | `isTTY === true` ⇒ the flag is WRITTEN | ✅ integration — `setRoutePrivilegeAsGranted.integration.test.ts` `[case1]` |
 *
 * 🔴 .the fourth row closed because the ACTOR became injectable, never because a pty appeared.
 *    the grant read `process.stdin.isTTY` inline at the cli, so its granted wire could be reached
 *    from exactly one direction — a spawn — and every spawn is a pipe. the leaf now takes
 *    `context: { isTTY }`, as its three peer human-only levers always did, so a test drives `true`
 *    directly and asserts the flag on disk plus the granted render, byte for byte (raised i002/r002
 *    by `ergo-contract-snapshots`, against `rule.require.contract-snapshot-exhaustiveness`).
 *
 *    ⇒ so this helper is a PRECONDITION shortcut, never a coverage gap. it writes what a human's
 *      grant writes because these cases need the flag present, and the operation that mints it is
 *      clamped elsewhere — not because the mint itself is unreachable by any test.
 */
const setPrivilegeFlagAsHuman = async (input: {
  cwd: string;
}): Promise<void> => {
  const flagPath = path.join(input.cwd, FLAG_PATH);
  await fs.mkdir(path.dirname(flagPath), { recursive: true });
  await fs.writeFile(flagPath, '');
};

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

      // the privilege is a PRECONDITION here, never the subject — a human granted it
      await setPrivilegeFlagAsHuman({ cwd: tempDir });

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

    // 🔴 the grant is HUMAN ONLY, and this is the end-to-end pin on it. a spawned skill has a pipe
    //    on stdin, never a tty, so the probe reads it as a non-human caller and refuses — which is
    //    the whole point: the flag lifts EVERY protected write on the route at once, a guard's
    //    `budget:` line among them, so a flag any clone may mint is a budget any clone may raise
    when('[t1] grant allow is REFUSED for a non-human caller', () => {
      const result = useThen('the grant is attempted', async () => {
        const grantResult = await invokeRouteSkill({
          skill: 'route.mutate',
          args: { grant: 'allow' },
          cwd: scene.tempDir,
        });

        const flagPath = path.join(scene.tempDir, FLAG_PATH);
        const flagPresent = await fs
          .access(flagPath)
          .then(() => true)
          .catch(() => false);

        return { grantResult, flagPresent };
      });

      // 🔴 these two assertions are the LIVE CLI WIRE's clamp, and no other case holds it.
      //    the leaf's own integration test INJECTS `isTTY: true`, so it proves the operation and
      //    never the one line that feeds it — `{ isTTY: process.stdin.isTTY === true }`
      //    (`route.ts`, the `grant allow` branch). a pipe reads `undefined`, so the two
      //    regressions that re-open the door both flip THIS pair:
      //
      //    | the regression | a pipe then reads | this case |
      //    |---|---|---|
      //    | the read dropped for a constant `true` | `true` ⇒ GRANTS | 🔴 red — code 0, flag present |
      //    | the probe inverted (`!== true`) | `undefined !== true` ⇒ GRANTS | 🔴 red — code 0, flag present |
      //
      //    ⚠️ a constant `false` is NOT caught here, and it is recorded at the call site rather
      //       than papered over. it fails CLOSED — a human's grant stops to work, which is loud on
      //       first use — where the two above fail OPEN and silently (raised i003/r004 n1).
      //
      // ⇒ delete either assertion below and the live wire is unproven again.
      then('exit code is 2 (a constraint the caller must fix)', () => {
        expect(result.grantResult.code).toEqual(2);
      });

      // the refusal is read BEFORE the write, so a refused grant leaves the route untouched
      then('no flag file is created', () => {
        expect(result.flagPresent).toBe(false);
      });

      then('the refusal names why, and what to do instead', () => {
        expect(result.grantResult.stderr).toContain('this grant is human only');
        expect(result.grantResult.stderr).toContain('ask a human to run it');
      });

      // stderr, never stdout — stdout may be hidden on a non-zero exit
      then('no grant is claimed on stdout', () => {
        expect(result.grantResult.stdout).not.toContain('granted');
      });

      then('stderr matches snapshot', () => {
        expect(result.grantResult.stderr).toMatchSnapshot(
          'grant allow - refused',
        );
      });
    });

    // the journey continues from the state a HUMAN's grant would have left
    when('[t1b] a human grants the privilege', () => {
      // an object, never a bare boolean — `useThen` hands back a proxy, and a proxy of a
      // primitive is an object rather than the primitive it wraps
      const result = useThen('the flag is placed', async () => {
        await setPrivilegeFlagAsHuman({ cwd: scene.tempDir });
        const flagPath = path.join(scene.tempDir, FLAG_PATH);
        const flagPresent = await fs
          .access(flagPath)
          .then(() => true)
          .catch(() => false);
        return { flagPresent };
      });

      then('the flag file is present', () => {
        expect(result.flagPresent).toBe(true);
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

      // 🔴 the journey's TERMINAL state is snapped, like every render step before it. a reviewer
      //    who follows the snapshots saw the arc open (blocked → refused → human-granted →
      //    allowed → revoked) and never saw it close (`rule.require.snapshot-every-journey-step`,
      //    raised i002/r001 n2). the arc's whole claim is that a revoke returns the route to the
      //    state it started in, and only a snapshot of both ends can show that.
      then('stdout matches snapshot', () => {
        expect(result.stdout).toMatchSnapshot('grant get - blocked again');
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

        // phase 2a: the driver reaches for the grant, and is REFUSED — human only
        const grantRefused = await invokeRouteSkill({
          skill: 'route.mutate',
          args: { grant: 'allow' },
          cwd: scene.tempDir,
        });
        expect(grantRefused.code).toEqual(2);
        expect(grantRefused.stderr).toMatchSnapshot(
          'phase 2a: grant allow refused',
        );

        // phase 2b: a human grants it, and the journey resumes from there
        await setPrivilegeFlagAsHuman({ cwd: scene.tempDir });

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

  given('[case7] bound route at .route/xyz/ (not .behavior/)', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDirForRhachet({
        slug: 'mutate-route-loc',
        clone: ASSETS_DIR,
      });

      // link the driver role
      await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });

      // create feature branch (simple name, no slashes)
      await execAsync('git checkout -b test-route-loc', { cwd: tempDir });

      // create route at .route/xyz/ (NOT .behavior/)
      const routeDir = path.join(
        tempDir,
        '.route',
        'v2026_03_19.declapract.upgrade',
      );
      const routeMeta = path.join(routeDir, '.route');
      await fs.mkdir(routeMeta, { recursive: true });

      // create a stone file
      await fs.writeFile(
        path.join(routeDir, '1.upgrade.invoke.stone'),
        '# upgrade invoke\n\nstone content.\n',
      );

      // create bind flag (bind the route to current branch)
      await fs.writeFile(
        path.join(routeMeta, '.bind.test-route-loc.flag'),
        'bound_by: test-route-loc\n',
      );

      return { tempDir, routeDir, routeMeta };
    });

    when('[t0] guard allows Write to .route/xyz/artifact.md', () => {
      const result = useThen('returns allowed', async () =>
        invokeRouteMutateGuard({
          cwd: scene.tempDir,
          stdin: {
            tool_name: 'Write',
            tool_input: {
              file_path: '.route/v2026_03_19.declapract.upgrade/1.upgrade.invoke.md',
            },
          },
        }),
      );

      then('exit code is 0 (allowed)', () => {
        expect(result.code).toEqual(0);
      });

      then('stdout matches snapshot', () => {
        expect(result.stdout).toMatchSnapshot('guard allows artifact in .route/xyz/');
      });
    });

    when('[t1] guard blocks Write to .route/xyz/.route/passage.jsonl', () => {
      const result = useThen('returns blocked', async () =>
        invokeRouteMutateGuard({
          cwd: scene.tempDir,
          stdin: {
            tool_name: 'Write',
            tool_input: {
              file_path:
                '.route/v2026_03_19.declapract.upgrade/.route/passage.jsonl',
            },
          },
        }),
      );

      then('exit code is 2 (blocked)', () => {
        expect(result.code).toEqual(2);
      });

      then('stderr matches snapshot', () => {
        expect(result.stderr).toMatchSnapshot('guard blocks metadata in .route/xyz/');
      });
    });

    when('[t2] guard blocks Read of *.stone in .route/xyz/', () => {
      const result = useThen('returns blocked', async () =>
        invokeRouteMutateGuard({
          cwd: scene.tempDir,
          stdin: {
            tool_name: 'Read',
            tool_input: {
              file_path:
                '.route/v2026_03_19.declapract.upgrade/1.upgrade.invoke.stone',
            },
          },
        }),
      );

      then('exit code is 2 (blocked)', () => {
        expect(result.code).toEqual(2);
      });

      then('stderr matches snapshot', () => {
        expect(result.stderr).toMatchSnapshot('guard blocks *.stone in .route/xyz/');
      });
    });
  });
});
