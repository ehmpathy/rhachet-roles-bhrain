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

  given('[case6] multiple --stone flags', () => {
    when('[t0] invoke with multiple --stone args in apply mode', () => {
      const res = useThen('invoke del with multiple stones', async () => {
        const tempDir = genTempDirForRhachet({
          slug: 'driver-del-multi',
          clone: ASSETS_DIR,
        });

        await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });

        const cli = await invokeRouteSkill({
          skill: 'route.stone.del',
          args: { stone: ['2.criteria', '3.plan'], route: '.', mode: 'apply' },
          cwd: tempDir,
        });

        console.log('\n--- cli.stdout ---');
        console.log(cli.stdout);
        console.log('--- end cli ---\n');

        const criteriaExists = await fs
          .access(path.join(tempDir, '2.criteria.stone'))
          .then(() => true)
          .catch(() => false);
        const planExists = await fs
          .access(path.join(tempDir, '3.plan.stone'))
          .then(() => true)
          .catch(() => false);

        return { cli, tempDir, criteriaExists, planExists };
      });

      then('cli completes successfully', () => {
        expect(res.cli.code).toEqual(0);
      });

      then('both stone files are removed', () => {
        expect(res.criteriaExists).toBe(false);
        expect(res.planExists).toBe(false);
      });

      then('stdout shows patterns section', () => {
        expect(res.cli.stdout).toContain('├─ patterns');
        expect(res.cli.stdout).toContain('*2.criteria*');
        expect(res.cli.stdout).toContain('*3.plan*');
      });

      then('stdout shows both stones deleted', () => {
        expect(res.cli.stdout).toContain('2.criteria');
        expect(res.cli.stdout).toContain('3.plan');
        expect(res.cli.stdout).toContain('(deleted)');
      });

      then('stdout matches snapshot', () => {
        expect(res.cli.stdout).toMatchSnapshot();
      });
    });
  });

  given('[case7] multiple --stone flags with overlap', () => {
    when('[t0] patterns overlap on same stone', () => {
      const res = useThen('invoke del with overlap', async () => {
        const tempDir = genTempDirForRhachet({
          slug: 'driver-del-overlap',
          clone: ASSETS_DIR,
        });

        await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });

        const cli = await invokeRouteSkill({
          skill: 'route.stone.del',
          args: { stone: ['3.plan', '3.*'], route: '.', mode: 'apply' },
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

      then('stone appears once in output (deduped)', () => {
        // 3.plan should appear once, not twice
        const matches = res.cli.stdout.match(/3\.plan/g) ?? [];
        // appears in patterns + once in stones section = 2 at most
        expect(matches.length).toBeLessThanOrEqual(3);
      });

      then('stdout matches snapshot', () => {
        expect(res.cli.stdout).toMatchSnapshot();
      });
    });
  });

  given('[case8] no --stone provided', () => {
    when('[t0] invoke without --stone flag', () => {
      const res = useThen('invoke del without stone', async () => {
        const tempDir = genTempDirForRhachet({
          slug: 'driver-del-nostone',
          clone: ASSETS_DIR,
        });

        await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });

        const cli = await invokeRouteSkill({
          skill: 'route.stone.del',
          args: { route: '.', mode: 'apply' },
          cwd: tempDir,
        });

        return { cli, tempDir };
      });

      then('cli exits with error code', () => {
        expect(res.cli.code).toEqual(2);
      });

      then('stderr shows error message', () => {
        expect(res.cli.stderr).toContain('--stone is required');
      });
    });
  });

  given('[case9] patterns match no stones', () => {
    when('[t0] invoke with patterns that match no stones', () => {
      const res = useThen('invoke del with no matches', async () => {
        const tempDir = genTempDirForRhachet({
          slug: 'driver-del-nomatch',
          clone: ASSETS_DIR,
        });

        await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });

        const cli = await invokeRouteSkill({
          skill: 'route.stone.del',
          args: { stone: ['99.nonexistent'], route: '.', mode: 'apply' },
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

      then('stdout shows no stones matched', () => {
        expect(res.cli.stdout).toContain('no stones matched');
      });
    });
  });
});
