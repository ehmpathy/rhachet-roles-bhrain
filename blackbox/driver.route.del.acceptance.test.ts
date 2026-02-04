import * as fs from 'fs/promises';
import * as path from 'path';
import { given, then, useThen, when } from 'test-fns';

import {
  execAsync,
  genTempDirForRhachet,
  invokeRouteSkill,
} from './.test/invokeRouteSkill';

const ASSETS_DIR = path.join(__dirname, '.test/assets/route-driver');

describe('driver.route.del.acceptance', () => {
  given('[case1] stone with no artifact', () => {
    when('[t0] stone is deleted', () => {
      const res = useThen('invoke del skill', async () => {
        const tempDir = genTempDirForRhachet({
          slug: 'driver-del-noart',
          clone: ASSETS_DIR,
        });

        // link the driver role
        await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });

        // invoke skill
        const cli = await invokeRouteSkill({
          skill: 'route.stone.del',
          args: { stone: '3.plan', route: '.' },
          cwd: tempDir,
        });

        console.log('\n--- cli.stdout ---');
        console.log(cli.stdout);
        console.log('\n--- cli.stderr ---');
        console.log(cli.stderr);
        console.log('--- end cli ---\n');

        // check if stone was deleted
        const stoneExists = await fs
          .access(path.join(tempDir, '3.plan.stone'))
          .then(() => true)
          .catch(() => false);

        return { cli, tempDir, stoneExists };
      });

      then('cli completes successfully', () => {
        expect(res.cli.code).toEqual(0);
      });

      then('outputs deleted message', () => {
        expect(res.cli.stdout).toContain('deleted');
        expect(res.cli.stdout).toContain('3.plan');
      });

      then('stone file is removed', () => {
        expect(res.stoneExists).toBe(false);
      });
    });
  });

  given('[case2] stone with artifact present', () => {
    when('[t0] delete is attempted', () => {
      const res = useThen('invoke del skill with artifact', async () => {
        const tempDir = genTempDirForRhachet({
          slug: 'driver-del-art',
          clone: ASSETS_DIR,
        });

        await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });

        // create artifact
        await fs.writeFile(path.join(tempDir, '1.vision.md'), '# Vision');

        const cli = await invokeRouteSkill({
          skill: 'route.stone.del',
          args: { stone: '1.vision', route: '.' },
          cwd: tempDir,
        });

        // check if stone still exists
        const stoneExists = await fs
          .access(path.join(tempDir, '1.vision.stone'))
          .then(() => true)
          .catch(() => false);

        return { cli, tempDir, stoneExists };
      });

      then('cli completes successfully', () => {
        expect(res.cli.code).toEqual(0);
      });

      then('outputs skipped message', () => {
        expect(res.cli.stdout).toContain('skipped');
      });

      then('stone file is preserved', () => {
        expect(res.stoneExists).toBe(true);
      });
    });
  });

  given('[case3] glob pattern matches multiple stones', () => {
    when('[t0] delete with glob *', () => {
      const res = useThen('invoke del skill with glob', async () => {
        const tempDir = genTempDirForRhachet({
          slug: 'driver-del-glob',
          clone: ASSETS_DIR,
        });

        await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });

        // create artifact for one stone only
        await fs.writeFile(path.join(tempDir, '1.vision.md'), '# Vision');

        const cli = await invokeRouteSkill({
          skill: 'route.stone.del',
          args: { stone: '*', route: '.' },
          cwd: tempDir,
        });

        return { cli, tempDir };
      });

      then('cli completes successfully', () => {
        expect(res.cli.code).toEqual(0);
      });

      then('deletes stones without artifacts', () => {
        expect(res.cli.stdout).toContain('deleted');
        expect(res.cli.stdout).toContain('2.criteria');
        expect(res.cli.stdout).toContain('3.plan');
      });

      then('skips stone with artifact', () => {
        expect(res.cli.stdout).toContain('skipped');
        expect(res.cli.stdout).toContain('1.vision');
      });
    });
  });
});
