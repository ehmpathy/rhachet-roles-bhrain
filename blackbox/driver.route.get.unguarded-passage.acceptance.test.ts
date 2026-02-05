import * as fs from 'fs/promises';
import * as path from 'path';
import { given, then, useThen, when } from 'test-fns';

import {
  execAsync,
  genTempDirForRhachet,
  invokeRouteSkill,
} from './.test/invokeRouteSkill';

const ASSETS_DIR = path.join(__dirname, '.test/assets/route-driver');

describe('driver.route.get.unguarded-passage.acceptance', () => {
  given('[case1] unguarded stones where first stone has output artifact', () => {
    when('[t0] route.stone.get --stone @next-one after artifact exists', () => {
      const res = useThen('invoke get skill', async () => {
        const tempDir = genTempDirForRhachet({
          slug: 'driver-get-unguarded-passage',
          clone: ASSETS_DIR,
        });

        // link the driver role
        await execAsync('npx rhachet roles link --role driver', {
          cwd: tempDir,
        });

        // write an output artifact for 1.vision (simulates a completed stone)
        await fs.writeFile(
          path.join(tempDir, '1.vision.md'),
          '# 1.vision\n\nthe vision is clear.\n',
        );

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

      then('skips 1.vision and returns 2.criteria', () => {
        expect(res.cli.stdout).not.toContain('1.vision');
        expect(res.cli.stdout).toContain('2.criteria');
      });
    });

    when('[t1] route.stone.get --stone @next-one after two artifacts exist', () => {
      const res = useThen('invoke get skill', async () => {
        const tempDir = genTempDirForRhachet({
          slug: 'driver-get-unguarded-two',
          clone: ASSETS_DIR,
        });

        // link the driver role
        await execAsync('npx rhachet roles link --role driver', {
          cwd: tempDir,
        });

        // write output artifacts for first two stones
        await fs.writeFile(
          path.join(tempDir, '1.vision.md'),
          '# 1.vision\n\nthe vision is clear.\n',
        );
        await fs.writeFile(
          path.join(tempDir, '2.criteria.md'),
          '# 2.criteria\n\ncriteria defined.\n',
        );

        // invoke skill
        const cli = await invokeRouteSkill({
          skill: 'route.stone.get',
          args: { stone: '@next-one', route: '.' },
          cwd: tempDir,
        });

        return { cli, tempDir };
      });

      then('cli completes successfully', () => {
        expect(res.cli.code).toEqual(0);
      });

      then('skips 1.vision and 2.criteria, returns 3.plan', () => {
        expect(res.cli.stdout).not.toContain('1.vision');
        expect(res.cli.stdout).not.toContain('2.criteria');
        expect(res.cli.stdout).toContain('3.plan');
      });
    });

    when('[t2] route.stone.get --stone @next-one with no artifacts', () => {
      const res = useThen('invoke get skill', async () => {
        const tempDir = genTempDirForRhachet({
          slug: 'driver-get-unguarded-none',
          clone: ASSETS_DIR,
        });

        // link the driver role
        await execAsync('npx rhachet roles link --role driver', {
          cwd: tempDir,
        });

        // no artifacts written — all stones are incomplete

        // invoke skill
        const cli = await invokeRouteSkill({
          skill: 'route.stone.get',
          args: { stone: '@next-one', route: '.' },
          cwd: tempDir,
        });

        return { cli, tempDir };
      });

      then('cli completes successfully', () => {
        expect(res.cli.code).toEqual(0);
      });

      then('returns 1.vision (first stone)', () => {
        expect(res.cli.stdout).toContain('1.vision');
      });
    });
  });
});
