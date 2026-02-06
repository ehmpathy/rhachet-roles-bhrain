import * as fs from 'fs/promises';
import * as path from 'path';
import { given, then, useThen, when } from 'test-fns';

import {
  execAsync,
  genTempDirForRhachet,
  invokeRouteSkill,
} from './.test/invokeRouteSkill';

const ASSETS_DIR = path.join(__dirname, '.test/assets/route-driver');

describe('driver.route.bind.autoresolve.acceptance', () => {
  given('[case1] bound route with stones', () => {
    when('[t0] route.stone.get --stone @next-one (no --route, after bind)', () => {
      const res = useThen('bind then get without --route', async () => {
        const tempDir = genTempDirForRhachet({
          slug: 'driver-autoresolve-get',
          clone: ASSETS_DIR,
        });

        await execAsync('npx rhachet roles link --role driver', {
          cwd: tempDir,
        });
        await execAsync('git checkout -b vlad/test-autoresolve', {
          cwd: tempDir,
        });

        // bind
        await invokeRouteSkill({
          skill: 'route.bind',
          args: { route: '.' },
          cwd: tempDir,
        });

        // get without --route
        const cli = await invokeRouteSkill({
          skill: 'route.stone.get',
          args: { stone: '@next-one' },
          cwd: tempDir,
        });

        return { cli, tempDir };
      });

      then('auto-resolves from bind', () => {
        expect(res.cli.code).toEqual(0);
      });

      then('returns first stone', () => {
        expect(res.cli.stdout).toContain('1.vision');
      });
    });

    when('[t1] route.stone.set --stone <name> --as passed (no --route, after bind)', () => {
      const res = useThen('bind then set without --route', async () => {
        const tempDir = genTempDirForRhachet({
          slug: 'driver-autoresolve-set',
          clone: ASSETS_DIR,
        });

        await execAsync('npx rhachet roles link --role driver', {
          cwd: tempDir,
        });
        await execAsync('git checkout -b vlad/test-autoresolve-set', {
          cwd: tempDir,
        });

        // bind
        await invokeRouteSkill({
          skill: 'route.bind',
          args: { route: '.' },
          cwd: tempDir,
        });

        // create artifact (required before set)
        await fs.writeFile(
          path.join(tempDir, '1.vision.md'),
          '# Vision\n\nTest artifact',
        );

        // set without --route
        const cli = await invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1.vision', as: 'passed' },
          cwd: tempDir,
        });

        return { cli, tempDir };
      });

      then('auto-resolves from bind', () => {
        expect(res.cli.code).toEqual(0);
      });
    });

    when('[t2] route.stone.get after first stone passed (no --route)', () => {
      const res = useThen(
        'bind, pass stone 1, get next',
        async () => {
          const tempDir = genTempDirForRhachet({
            slug: 'driver-autoresolve-sequence',
            clone: ASSETS_DIR,
          });

          await execAsync('npx rhachet roles link --role driver', {
            cwd: tempDir,
          });
          await execAsync('git checkout -b vlad/test-autoresolve-seq', {
            cwd: tempDir,
          });

          // bind
          await invokeRouteSkill({
            skill: 'route.bind',
            args: { route: '.' },
            cwd: tempDir,
          });

          // create artifact (required before set)
          await fs.writeFile(
            path.join(tempDir, '1.vision.md'),
            '# Vision\n\nTest artifact',
          );

          // pass first stone
          await invokeRouteSkill({
            skill: 'route.stone.set',
            args: { stone: '1.vision', as: 'passed' },
            cwd: tempDir,
          });

          // get next stone
          const cli = await invokeRouteSkill({
            skill: 'route.stone.get',
            args: { stone: '@next-one' },
            cwd: tempDir,
          });

          return { cli, tempDir };
        },
      );

      then('returns second stone (first already passed)', () => {
        expect(res.cli.code).toEqual(0);
        expect(res.cli.stdout).toContain('2.criteria');
      });
    });

    when('[t3] explicit --route wins over bind', () => {
      const res = useThen('bind then get with explicit --route', async () => {
        const tempDir = genTempDirForRhachet({
          slug: 'driver-autoresolve-explicit',
          clone: ASSETS_DIR,
        });

        await execAsync('npx rhachet roles link --role driver', {
          cwd: tempDir,
        });
        await execAsync('git checkout -b vlad/test-explicit', {
          cwd: tempDir,
        });

        // bind to root
        await invokeRouteSkill({
          skill: 'route.bind',
          args: { route: '.' },
          cwd: tempDir,
        });

        // get with explicit --route (same path, proves explicit still works)
        const cli = await invokeRouteSkill({
          skill: 'route.stone.get',
          args: { stone: '@next-one', route: '.' },
          cwd: tempDir,
        });

        return { cli, tempDir };
      });

      then('explicit --route works', () => {
        expect(res.cli.code).toEqual(0);
        expect(res.cli.stdout).toContain('1.vision');
      });
    });

    when('[t4] after unbind, auto-resolve fails', () => {
      const res = useThen('bind, unbind, then get without --route', async () => {
        const tempDir = genTempDirForRhachet({
          slug: 'driver-autoresolve-unbind',
          clone: ASSETS_DIR,
        });

        await execAsync('npx rhachet roles link --role driver', {
          cwd: tempDir,
        });
        await execAsync('git checkout -b vlad/test-unbind', {
          cwd: tempDir,
        });

        // bind then unbind
        await invokeRouteSkill({
          skill: 'route.bind',
          args: { route: '.' },
          cwd: tempDir,
        });
        await invokeRouteSkill({
          skill: 'route.bind',
          args: { del: true },
          cwd: tempDir,
        });

        // get without --route (should fail)
        const cli = await invokeRouteSkill({
          skill: 'route.stone.get',
          args: { stone: '@next-one' },
          cwd: tempDir,
        });

        return { cli, tempDir };
      });

      then('error mentions no route bound', () => {
        expect(res.cli.stderr).toContain('no route bound');
      });

      then('exit code is nonzero', () => {
        expect(res.cli.code).not.toEqual(0);
      });
    });
  });

  given('[case2] branch with no bind', () => {
    when('[t0] route.stone.get --stone @next-one (no --route, no bind)', () => {
      const res = useThen('get without bind or --route', async () => {
        const tempDir = genTempDirForRhachet({
          slug: 'driver-autoresolve-nobound',
          clone: ASSETS_DIR,
        });

        await execAsync('npx rhachet roles link --role driver', {
          cwd: tempDir,
        });
        await execAsync('git checkout -b vlad/test-nobound', {
          cwd: tempDir,
        });

        // get without --route and no bind
        const cli = await invokeRouteSkill({
          skill: 'route.stone.get',
          args: { stone: '@next-one' },
          cwd: tempDir,
        });

        return { cli, tempDir };
      });

      then('error mentions no route bound', () => {
        expect(res.cli.stderr).toContain('no route bound');
      });

      then('error mentions route.bind', () => {
        expect(res.cli.stderr).toContain('route.bind');
      });

      then('exit code is nonzero', () => {
        expect(res.cli.code).not.toEqual(0);
      });
    });
  });
});
