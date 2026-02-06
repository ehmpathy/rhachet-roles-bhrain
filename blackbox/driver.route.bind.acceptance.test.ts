import * as path from 'path';
import { given, then, useThen, when } from 'test-fns';

import {
  execAsync,
  genTempDirForRhachet,
  invokeRouteSkill,
} from './.test/invokeRouteSkill';

const ASSETS_DIR = path.join(__dirname, '.test/assets/route-driver');

describe('driver.route.bind.acceptance', () => {
  given('[case1] route with stones', () => {
    when('[t0] route.bind --route <path>', () => {
      const res = useThen('invoke bind skill', async () => {
        const tempDir = genTempDirForRhachet({
          slug: 'driver-bind-set',
          clone: ASSETS_DIR,
        });

        // link the driver role
        await execAsync('npx rhachet roles link --role driver', {
          cwd: tempDir,
        });

        // create a feature branch (bind rejects protected branches)
        await execAsync('git checkout -b vlad/test-bind', { cwd: tempDir });

        // invoke bind
        const cli = await invokeRouteSkill({
          skill: 'route.bind',
          args: { route: '.' },
          cwd: tempDir,
        });

        return { cli, tempDir };
      });

      then('exit code is 0', () => {
        expect(res.cli.code).toEqual(0);
      });

      then('stdout confirms bound route', () => {
        expect(res.cli.stdout).toContain('bound route');
      });
    });

    when('[t1] route.bind --route <path> (second time, same path)', () => {
      const res = useThen('invoke bind skill twice', async () => {
        const tempDir = genTempDirForRhachet({
          slug: 'driver-bind-idempotent',
          clone: ASSETS_DIR,
        });

        await execAsync('npx rhachet roles link --role driver', {
          cwd: tempDir,
        });
        await execAsync('git checkout -b vlad/test-idem', { cwd: tempDir });

        // bind first time
        await invokeRouteSkill({
          skill: 'route.bind',
          args: { route: '.' },
          cwd: tempDir,
        });

        // bind second time (idempotent)
        const cli = await invokeRouteSkill({
          skill: 'route.bind',
          args: { route: '.' },
          cwd: tempDir,
        });

        return { cli, tempDir };
      });

      then('idempotent — exit code 0', () => {
        expect(res.cli.code).toEqual(0);
      });
    });

    when('[t2] route.bind --get (after bind)', () => {
      const res = useThen('invoke bind --get after bind', async () => {
        const tempDir = genTempDirForRhachet({
          slug: 'driver-bind-get',
          clone: ASSETS_DIR,
        });

        await execAsync('npx rhachet roles link --role driver', {
          cwd: tempDir,
        });
        await execAsync('git checkout -b vlad/test-get', { cwd: tempDir });

        // bind first
        await invokeRouteSkill({
          skill: 'route.bind',
          args: { route: '.' },
          cwd: tempDir,
        });

        // query
        const cli = await invokeRouteSkill({
          skill: 'route.bind',
          args: { get: true },
          cwd: tempDir,
        });

        return { cli, tempDir };
      });

      then('stdout shows bound route path', () => {
        expect(res.cli.stdout).toContain('bound to:');
      });

      then('exit code is 0', () => {
        expect(res.cli.code).toEqual(0);
      });
    });

    when('[t3] route.bind --del (after bind)', () => {
      const res = useThen('invoke bind --del after bind', async () => {
        const tempDir = genTempDirForRhachet({
          slug: 'driver-bind-del',
          clone: ASSETS_DIR,
        });

        await execAsync('npx rhachet roles link --role driver', {
          cwd: tempDir,
        });
        await execAsync('git checkout -b vlad/test-del', { cwd: tempDir });

        // bind
        await invokeRouteSkill({
          skill: 'route.bind',
          args: { route: '.' },
          cwd: tempDir,
        });

        // unbind
        const cli = await invokeRouteSkill({
          skill: 'route.bind',
          args: { del: true },
          cwd: tempDir,
        });

        return { cli, tempDir };
      });

      then('exit code is 0', () => {
        expect(res.cli.code).toEqual(0);
      });

      then('stdout confirms unbind', () => {
        expect(res.cli.stdout).toContain('unbound route');
      });
    });

    when('[t4] route.bind --del (second time, idempotent)', () => {
      const res = useThen('invoke bind --del twice', async () => {
        const tempDir = genTempDirForRhachet({
          slug: 'driver-bind-del-idem',
          clone: ASSETS_DIR,
        });

        await execAsync('npx rhachet roles link --role driver', {
          cwd: tempDir,
        });
        await execAsync('git checkout -b vlad/test-del-idem', {
          cwd: tempDir,
        });

        // bind then unbind twice
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
        const cli = await invokeRouteSkill({
          skill: 'route.bind',
          args: { del: true },
          cwd: tempDir,
        });

        return { cli, tempDir };
      });

      then('idempotent — exit code 0', () => {
        expect(res.cli.code).toEqual(0);
      });
    });

    when('[t5] route.bind --get (after del)', () => {
      const res = useThen('invoke bind --get after del', async () => {
        const tempDir = genTempDirForRhachet({
          slug: 'driver-bind-get-after-del',
          clone: ASSETS_DIR,
        });

        await execAsync('npx rhachet roles link --role driver', {
          cwd: tempDir,
        });
        await execAsync('git checkout -b vlad/test-get-del', {
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

        // query
        const cli = await invokeRouteSkill({
          skill: 'route.bind',
          args: { get: true },
          cwd: tempDir,
        });

        return { cli, tempDir };
      });

      then('stdout shows "not bound"', () => {
        expect(res.cli.stdout).toContain('not bound');
      });
    });
  });

  given('[case2] route path not found', () => {
    when('[t0] route.bind --route <bad-path>', () => {
      const res = useThen('invoke bind with bad path', async () => {
        const tempDir = genTempDirForRhachet({
          slug: 'driver-bind-badpath',
          clone: ASSETS_DIR,
        });

        await execAsync('npx rhachet roles link --role driver', {
          cwd: tempDir,
        });
        await execAsync('git checkout -b vlad/test-badpath', {
          cwd: tempDir,
        });

        const cli = await invokeRouteSkill({
          skill: 'route.bind',
          args: { route: 'nonexistent-route' },
          cwd: tempDir,
        });

        return { cli, tempDir };
      });

      then('error mentions path', () => {
        expect(res.cli.stderr).toContain('nonexistent-route');
      });

      then('exit code is nonzero', () => {
        expect(res.cli.code).not.toEqual(0);
      });
    });
  });

  given('[case3] protected branch (main)', () => {
    when('[t0] route.bind --route <path> on main', () => {
      const res = useThen('invoke bind on main branch', async () => {
        const tempDir = genTempDirForRhachet({
          slug: 'driver-bind-protected',
          clone: ASSETS_DIR,
        });

        await execAsync('npx rhachet roles link --role driver', {
          cwd: tempDir,
        });

        // stay on main (genTempDirForRhachet inits with main)
        const cli = await invokeRouteSkill({
          skill: 'route.bind',
          args: { route: '.' },
          cwd: tempDir,
        });

        return { cli, tempDir };
      });

      then('error mentions protected branch', () => {
        expect(res.cli.stderr).toContain('protected branch');
      });

      then('exit code is nonzero', () => {
        expect(res.cli.code).not.toEqual(0);
      });
    });
  });

  given('[case4] bind to different route when already bound', () => {
    when('[t0] route.bind --route <path-B> after bound to <path-A>', () => {
      const res = useThen('invoke bind to different route', async () => {
        const tempDir = genTempDirForRhachet({
          slug: 'driver-bind-conflict',
          clone: ASSETS_DIR,
        });

        await execAsync('npx rhachet roles link --role driver', {
          cwd: tempDir,
        });
        await execAsync('git checkout -b vlad/test-conflict', {
          cwd: tempDir,
        });

        // create a second route directory
        await execAsync('mkdir -p other-route', { cwd: tempDir });

        // bind to root route first
        await invokeRouteSkill({
          skill: 'route.bind',
          args: { route: '.' },
          cwd: tempDir,
        });

        // attempt to bind to different route
        const cli = await invokeRouteSkill({
          skill: 'route.bind',
          args: { route: 'other-route' },
          cwd: tempDir,
        });

        return { cli, tempDir };
      });

      then('error mentions already bound', () => {
        expect(res.cli.stderr).toContain('already bound');
      });

      then('exit code is nonzero', () => {
        expect(res.cli.code).not.toEqual(0);
      });
    });
  });
});
