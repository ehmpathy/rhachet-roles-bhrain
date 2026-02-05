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
  given('[case1] default plan mode, stone with no artifact', () => {
    when('[t0] invoke without --mode flag', () => {
      const res = useThen('invoke del skill in default plan mode', async () => {
        const tempDir = genTempDirForRhachet({
          slug: 'driver-del-plan-def',
          clone: ASSETS_DIR,
        });

        await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });

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

        // check if stone still exists (plan mode = no deletion)
        const stoneExists = await fs
          .access(path.join(tempDir, '3.plan.stone'))
          .then(() => true)
          .catch(() => false);

        return { cli, tempDir, stoneExists };
      });

      then('cli completes successfully', () => {
        expect(res.cli.code).toEqual(0);
      });

      then('defaults to plan mode', () => {
        expect(res.cli.stdout).toContain('--mode plan');
      });

      then('stone file is preserved (plan = no disk changes)', () => {
        expect(res.stoneExists).toBe(true);
      });

      then('stdout has treestruct format', () => {
        expect(res.cli.stdout).toContain(`hoo needs 'em`);
        expect(res.cli.stdout).toContain('route.stone.del');
        expect(res.cli.stdout).toContain('rerun with --mode apply');
      });

      then('stdout matches snapshot', () => {
        expect(res.cli.stdout).toMatchSnapshot();
      });
    });
  });

  given('[case2] apply mode, stone with no artifact', () => {
    when('[t0] invoke with --mode apply', () => {
      const res = useThen('invoke del skill in apply mode', async () => {
        const tempDir = genTempDirForRhachet({
          slug: 'driver-del-apply',
          clone: ASSETS_DIR,
        });

        await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });

        const cli = await invokeRouteSkill({
          skill: 'route.stone.del',
          args: { stone: '3.plan', route: '.', mode: 'apply' },
          cwd: tempDir,
        });

        console.log('\n--- cli.stdout ---');
        console.log(cli.stdout);
        console.log('\n--- cli.stderr ---');
        console.log(cli.stderr);
        console.log('--- end cli ---\n');

        const stoneExists = await fs
          .access(path.join(tempDir, '3.plan.stone'))
          .then(() => true)
          .catch(() => false);

        return { cli, tempDir, stoneExists };
      });

      then('cli completes successfully', () => {
        expect(res.cli.code).toEqual(0);
      });

      then('stone file is removed', () => {
        expect(res.stoneExists).toBe(false);
      });

      then('stdout shows deleted in treestruct', () => {
        expect(res.cli.stdout).toContain(`hoo needs 'em`);
        expect(res.cli.stdout).toContain('--mode apply');
        expect(res.cli.stdout).toContain('(deleted)');
        expect(res.cli.stdout).toContain('3.plan');
      });

      then('stdout matches snapshot', () => {
        expect(res.cli.stdout).toMatchSnapshot();
      });
    });
  });

  given('[case3] apply mode with artifact present', () => {
    when('[t0] delete is attempted on stone with artifact', () => {
      const res = useThen('invoke del with artifact', async () => {
        const tempDir = genTempDirForRhachet({
          slug: 'driver-del-retain',
          clone: ASSETS_DIR,
        });

        await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });

        // create artifact for 1.vision
        await fs.writeFile(path.join(tempDir, '1.vision.md'), '# Vision');

        const cli = await invokeRouteSkill({
          skill: 'route.stone.del',
          args: { stone: '1.vision', route: '.', mode: 'apply' },
          cwd: tempDir,
        });

        const stoneExists = await fs
          .access(path.join(tempDir, '1.vision.stone'))
          .then(() => true)
          .catch(() => false);

        return { cli, tempDir, stoneExists };
      });

      then('cli completes successfully', () => {
        expect(res.cli.code).toEqual(0);
      });

      then('stone file is preserved', () => {
        expect(res.stoneExists).toBe(true);
      });

      then('stdout shows retained with artifact reason', () => {
        expect(res.cli.stdout).toContain('(retained, artifact found)');
      });

      then('stdout matches snapshot', () => {
        expect(res.cli.stdout).toMatchSnapshot();
      });
    });
  });

  given('[case4] fuzzy pattern match via natural word', () => {
    when('[t0] invoke with plain word "plan" (no glob chars)', () => {
      const res = useThen('invoke del with fuzzy pattern', async () => {
        const tempDir = genTempDirForRhachet({
          slug: 'driver-del-fuzzy',
          clone: ASSETS_DIR,
        });

        await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });

        const cli = await invokeRouteSkill({
          skill: 'route.stone.del',
          args: { stone: 'plan', route: '.' },
          cwd: tempDir,
        });

        console.log('\n--- cli.stdout ---');
        console.log(cli.stdout);
        console.log('--- end cli ---\n');

        return { cli, tempDir };
      });

      then('cli completes successfully', () => {
        expect(res.cli.code).toEqual(0);
      });

      then('pattern shows auto-expansion', () => {
        expect(res.cli.stdout).toContain('*plan*');
      });

      then('matches stone with "plan" in name', () => {
        expect(res.cli.stdout).toContain('3.plan');
      });

      then('stdout matches snapshot', () => {
        expect(res.cli.stdout).toMatchSnapshot();
      });
    });
  });

  given('[case5] glob pattern matches multiple stones with mixed outcomes', () => {
    when('[t0] delete with glob * in apply mode', () => {
      const res = useThen('invoke del with glob apply', async () => {
        const tempDir = genTempDirForRhachet({
          slug: 'driver-del-glob-apply',
          clone: ASSETS_DIR,
        });

        await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });

        // create artifact for one stone only
        await fs.writeFile(path.join(tempDir, '1.vision.md'), '# Vision');

        const cli = await invokeRouteSkill({
          skill: 'route.stone.del',
          args: { stone: '*', route: '.', mode: 'apply' },
          cwd: tempDir,
        });

        return { cli, tempDir };
      });

      then('cli completes successfully', () => {
        expect(res.cli.code).toEqual(0);
      });

      then('shows deleted for stones without artifacts', () => {
        expect(res.cli.stdout).toContain('(deleted)');
        expect(res.cli.stdout).toContain('2.criteria');
        expect(res.cli.stdout).toContain('3.plan');
      });

      then('shows retained for stone with artifact', () => {
        expect(res.cli.stdout).toContain('(retained, artifact found)');
        expect(res.cli.stdout).toContain('1.vision');
      });

      then('output has treestruct format', () => {
        expect(res.cli.stdout).toContain(`hoo needs 'em`);
        expect(res.cli.stdout).toContain('route.stone.del --mode apply');
      });

      then('stdout matches snapshot', () => {
        expect(res.cli.stdout).toMatchSnapshot();
      });
    });
  });
});
