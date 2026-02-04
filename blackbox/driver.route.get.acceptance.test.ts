import * as path from 'path';
import { given, then, useThen, when } from 'test-fns';

import {
  execAsync,
  genTempDirForRhachet,
  invokeRouteSkill,
} from './.test/invokeRouteSkill';

const ASSETS_DIR = path.join(__dirname, '.test/assets/route-driver');

describe('driver.route.get.acceptance', () => {
  given('[case1] route with multiple stones', () => {
    when('[t0] route.stone.get --stone @next-one', () => {
      const res = useThen('invoke get skill', async () => {
        const tempDir = genTempDirForRhachet({
          slug: 'driver-get-nextone',
          clone: ASSETS_DIR,
        });

        // link the driver role
        await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });

        // invoke skill
        const cli = await invokeRouteSkill({
          skill: 'route.stone.get',
          args: { stone: '@next-one', route: '.' },
          cwd: tempDir,
        });

        console.log('\n--- cli.stdout ---');
        console.log(cli.stdout);
        console.log('\n--- cli.stderr ---');
        console.log(cli.stderr);
        console.log('--- end cli ---\n');

        return { cli, tempDir };
      });

      then('cli completes successfully', () => {
        expect(res.cli.code).toEqual(0);
      });

      then('returns first stone', () => {
        expect(res.cli.stdout).toContain('1.vision');
      });
    });

    when('[t1] route.stone.get --stone @next-one --say', () => {
      const res = useThen('invoke get skill with --say', async () => {
        const tempDir = genTempDirForRhachet({
          slug: 'driver-get-say',
          clone: ASSETS_DIR,
        });

        await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });

        const cli = await invokeRouteSkill({
          skill: 'route.stone.get',
          args: { stone: '@next-one', route: '.', say: true },
          cwd: tempDir,
        });

        return { cli, tempDir };
      });

      then('cli completes successfully', () => {
        expect(res.cli.code).toEqual(0);
      });

      then('outputs stone content', () => {
        expect(res.cli.stdout).toContain('# 1.vision');
        expect(res.cli.stdout).toContain('describe the vision');
      });
    });

    when('[t2] route.stone.get --stone @next-all', () => {
      const res = useThen('invoke get skill with @next-all', async () => {
        const tempDir = genTempDirForRhachet({
          slug: 'driver-get-nextall',
          clone: ASSETS_DIR,
        });

        await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });

        const cli = await invokeRouteSkill({
          skill: 'route.stone.get',
          args: { stone: '@next-all', route: '.' },
          cwd: tempDir,
        });

        return { cli, tempDir };
      });

      then('cli completes successfully', () => {
        expect(res.cli.code).toEqual(0);
      });

      then('returns first stone (unique prefix)', () => {
        // all stones have unique prefixes so only first returned
        expect(res.cli.stdout).toContain('1.vision');
      });
    });
  });
});
