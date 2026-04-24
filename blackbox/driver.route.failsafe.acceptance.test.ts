import * as fs from 'fs/promises';
import * as path from 'path';
import { given, then, useBeforeAll, useThen, when } from 'test-fns';

import {
  execAsync,
  genTempDirForRhachet,
  invokeRouteSkill,
  sanitizeTimeForSnapshot,
} from './.test/invokeRouteSkill';

const ASSETS_DIR = path.join(__dirname, '.test/assets/route-failsafe');

/**
 * .what = acceptance tests for route reviewer/judge failsafe behavior
 * .why = verifies the criteria from usecase.1-5:
 *        - tree bucket format for stdout/stderr
 *        - exit code classification (0=passed, 2=constraint, other=malfunction)
 *        - malfunction escalation via route.drive
 */
describe('driver.route.failsafe.acceptance', () => {
  // =========================================================================
  // REVIEWER EXIT CODES
  // =========================================================================

  given('[case1] reviewer exits with code 0 (passed)', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDirForRhachet({
        slug: 'failsafe-review-pass',
        clone: ASSETS_DIR,
      });
      await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });
      await execAsync('chmod +x .test/*.sh', { cwd: tempDir });
      await execAsync('git checkout -b vlad/test-failsafe-case1', { cwd: tempDir });
      await invokeRouteSkill({
        skill: 'route.bind.set',
        args: { route: '.' },
        cwd: tempDir,
      });
      await fs.writeFile(
        path.join(tempDir, '1.review-pass.i1.md'),
        '# artifact\n\ntest content',
      );
      return { tempDir };
    });

    when('[t0] route.stone.set --as passed is invoked', () => {
      const result = useThen('reviewer passes', async () =>
        invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1.review-pass', as: 'passed' },
          cwd: scene.tempDir,
        }),
      );

      then('exit code is 0', () => {
        expect(result.code).toEqual(0);
      });

      then('passage is allowed', () => {
        expect(result.stdout).toContain('passage = allowed');
      });

      then('stdout matches snapshot', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });
  });

  given('[case2] reviewer exits with code 2 (constraint)', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDirForRhachet({
        slug: 'failsafe-review-constraint',
        clone: ASSETS_DIR,
      });
      await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });
      await execAsync('chmod +x .test/*.sh', { cwd: tempDir });
      await execAsync('git checkout -b vlad/test-failsafe-case2', { cwd: tempDir });
      await invokeRouteSkill({
        skill: 'route.bind.set',
        args: { route: '.' },
        cwd: tempDir,
      });
      await fs.writeFile(
        path.join(tempDir, '2.review-constraint.i1.md'),
        '# artifact\n\ntest content',
      );
      return { tempDir };
    });

    when('[t0] route.stone.set --as passed is invoked', () => {
      const result = useThen('reviewer fails by constraint', async () =>
        invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '2.review-constraint', as: 'passed' },
          cwd: scene.tempDir,
        }),
      );

      then('exit code is 2', () => {
        expect(result.code).toEqual(2);
      });

      then('passage is blocked', () => {
        expect(result.stdout).toContain('passage = blocked');
      });

      then('output shows tree bucket format with stdout', () => {
        const output = result.stdout + result.stderr;
        expect(output).toContain('├─ stdout');
      });

      then('output shows "blocked by constraints"', () => {
        const output = result.stdout + result.stderr;
        expect(output).toContain('blocked by constraints');
      });

      then('output shows exit code 2 with stop emoji', () => {
        const output = result.stdout + result.stderr;
        expect(output).toContain('exit code: 2 ✋');
      });

      then('stdout matches snapshot', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });

      then('stderr matches snapshot', () => {
        expect(result.stderr).toMatchSnapshot();
      });
    });
  });

  given('[case3] reviewer exits with code 1 (malfunction)', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDirForRhachet({
        slug: 'failsafe-review-malfunction',
        clone: ASSETS_DIR,
      });
      await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });
      await execAsync('chmod +x .test/*.sh', { cwd: tempDir });
      await execAsync('git checkout -b vlad/test-failsafe-case3', { cwd: tempDir });
      await invokeRouteSkill({
        skill: 'route.bind.set',
        args: { route: '.' },
        cwd: tempDir,
      });
      await fs.writeFile(
        path.join(tempDir, '3.review-malfunction.i1.md'),
        '# artifact\n\ntest content',
      );
      return { tempDir };
    });

    when('[t0] route.stone.set --as passed is invoked', () => {
      const result = useThen('reviewer malfunctions', async () =>
        invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '3.review-malfunction', as: 'passed' },
          cwd: scene.tempDir,
        }),
      );

      then('exit code is 2', () => {
        expect(result.code).toEqual(2);
      });

      then('passage is malfunction', () => {
        expect(result.stdout).toContain('passage = malfunction');
      });

      then('output shows reviewer malfunctioned reason', () => {
        expect(result.stdout).toContain('reviewer or judge malfunctioned');
      });

      then('stdout matches snapshot', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });

      then('stderr matches snapshot', () => {
        expect(result.stderr).toMatchSnapshot();
      });
    });

    when('[t1] passage.jsonl is checked', () => {
      then('malfunction status is recorded', async () => {
        const passagePath = path.join(scene.tempDir, '.route', 'passage.jsonl');
        const content = await fs.readFile(passagePath, 'utf-8');
        const lines = content.split('\n').filter(Boolean);
        const entry = lines.find((line) => {
          const parsed = JSON.parse(line);
          return parsed.stone === '3.review-malfunction';
        });
        expect(entry).toBeDefined();
        const parsed = JSON.parse(entry!);
        expect(parsed.status).toEqual('malfunction');
      });
    });

    when('[t2] route.drive is invoked after malfunction', () => {
      const result = useThen('route.drive halts', async () =>
        invokeRouteSkill({
          skill: 'route.drive',
          args: { when: 'hook.onBoot' },
          cwd: scene.tempDir,
        }),
      );

      then('exit code is 3 (halt)', () => {
        expect(result.code).toEqual(3);
      });

      then('output mentions malfunction', () => {
        const output = result.stdout + result.stderr;
        expect(output.toLowerCase()).toContain('malfunction');
      });

      then('output mentions human', () => {
        const output = result.stdout + result.stderr;
        expect(output.toLowerCase()).toContain('human');
      });

      then('stdout matches snapshot', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });
  });

  // =========================================================================
  // JUDGE EXIT CODES
  // =========================================================================

  given('[case4] judge exits with code 0 (passed)', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDirForRhachet({
        slug: 'failsafe-judge-pass',
        clone: ASSETS_DIR,
      });
      await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });
      await execAsync('chmod +x .test/*.sh', { cwd: tempDir });
      await execAsync('git checkout -b vlad/test-failsafe-case4', { cwd: tempDir });
      await invokeRouteSkill({
        skill: 'route.bind.set',
        args: { route: '.' },
        cwd: tempDir,
      });
      await fs.writeFile(
        path.join(tempDir, '4.judge-pass.i1.md'),
        '# artifact\n\ntest content',
      );
      return { tempDir };
    });

    when('[t0] route.stone.set --as passed is invoked', () => {
      const result = useThen('judge passes', async () =>
        invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '4.judge-pass', as: 'passed' },
          cwd: scene.tempDir,
        }),
      );

      then('exit code is 0', () => {
        expect(result.code).toEqual(0);
      });

      then('passage is allowed', () => {
        expect(result.stdout).toContain('passage = allowed');
      });

      then('stdout matches snapshot', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });
  });

  given('[case5] judge exits with code 2 (constraint)', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDirForRhachet({
        slug: 'failsafe-judge-constraint',
        clone: ASSETS_DIR,
      });
      await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });
      await execAsync('chmod +x .test/*.sh', { cwd: tempDir });
      await execAsync('git checkout -b vlad/test-failsafe-case5', { cwd: tempDir });
      await invokeRouteSkill({
        skill: 'route.bind.set',
        args: { route: '.' },
        cwd: tempDir,
      });
      await fs.writeFile(
        path.join(tempDir, '5.judge-constraint.i1.md'),
        '# artifact\n\ntest content',
      );
      return { tempDir };
    });

    when('[t0] route.stone.set --as passed is invoked', () => {
      const result = useThen('judge fails by constraint', async () =>
        invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '5.judge-constraint', as: 'passed' },
          cwd: scene.tempDir,
        }),
      );

      then('exit code is 2', () => {
        expect(result.code).toEqual(2);
      });

      then('passage is blocked', () => {
        expect(result.stdout).toContain('passage = blocked');
      });

      then('output shows "blocked by constraints"', () => {
        const output = result.stdout + result.stderr;
        expect(output).toContain('blocked by constraints');
      });

      then('output shows exit code 2 with stop emoji', () => {
        const output = result.stdout + result.stderr;
        expect(output).toContain('exit code: 2 ✋');
      });

      then('stdout matches snapshot', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });

      then('stderr matches snapshot', () => {
        expect(result.stderr).toMatchSnapshot();
      });
    });
  });

  given('[case6] judge exits with code 1 (malfunction)', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDirForRhachet({
        slug: 'failsafe-judge-malfunction',
        clone: ASSETS_DIR,
      });
      await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });
      await execAsync('chmod +x .test/*.sh', { cwd: tempDir });
      await execAsync('git checkout -b vlad/test-failsafe-case6', { cwd: tempDir });
      await invokeRouteSkill({
        skill: 'route.bind.set',
        args: { route: '.' },
        cwd: tempDir,
      });
      await fs.writeFile(
        path.join(tempDir, '6.judge-malfunction.i1.md'),
        '# artifact\n\ntest content',
      );
      return { tempDir };
    });

    when('[t0] route.stone.set --as passed is invoked', () => {
      const result = useThen('judge malfunctions', async () =>
        invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '6.judge-malfunction', as: 'passed' },
          cwd: scene.tempDir,
        }),
      );

      then('exit code is 2', () => {
        expect(result.code).toEqual(2);
      });

      then('passage is malfunction', () => {
        expect(result.stdout).toContain('passage = malfunction');
      });

      then('output shows tree bucket format with stdout', () => {
        const output = result.stdout + result.stderr;
        expect(output).toContain('├─ stdout');
      });

      then('output shows tree bucket format with stderr', () => {
        const output = result.stdout + result.stderr;
        expect(output).toContain('├─ stderr');
      });

      then('output shows "blocked by malfunction"', () => {
        const output = result.stdout + result.stderr;
        expect(output).toContain('blocked by malfunction');
      });

      then('output shows exit code 1 with explosion emoji', () => {
        const output = result.stdout + result.stderr;
        expect(output).toContain('exit code: 1 💥');
      });

      then('stdout matches snapshot', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });

      then('stderr matches snapshot', () => {
        expect(result.stderr).toMatchSnapshot();
      });
    });

    when('[t1] passage.jsonl is checked', () => {
      then('malfunction status is recorded', async () => {
        const passagePath = path.join(scene.tempDir, '.route', 'passage.jsonl');
        const content = await fs.readFile(passagePath, 'utf-8');
        const lines = content.split('\n').filter(Boolean);
        const entry = lines.find((line) => {
          const parsed = JSON.parse(line);
          return parsed.stone === '6.judge-malfunction';
        });
        expect(entry).toBeDefined();
        const parsed = JSON.parse(entry!);
        expect(parsed.status).toEqual('malfunction');
      });
    });

    when('[t2] route.drive is invoked after malfunction', () => {
      const result = useThen('route.drive halts', async () =>
        invokeRouteSkill({
          skill: 'route.drive',
          args: { when: 'hook.onBoot' },
          cwd: scene.tempDir,
        }),
      );

      then('exit code is 3 (halt)', () => {
        expect(result.code).toEqual(3);
      });

      then('output mentions malfunction', () => {
        const output = result.stdout + result.stderr;
        expect(output.toLowerCase()).toContain('malfunction');
      });

      then('output mentions human', () => {
        const output = result.stdout + result.stderr;
        expect(output.toLowerCase()).toContain('human');
      });

      then('stdout matches snapshot', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });
  });

  // =========================================================================
  // BOTH REVIEWER AND JUDGE MALFUNCTION
  // =========================================================================

  given('[case7] both reviewer and judge malfunction', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDirForRhachet({
        slug: 'failsafe-both-malfunction',
        clone: ASSETS_DIR,
      });
      await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });
      await execAsync('chmod +x .test/*.sh', { cwd: tempDir });
      await execAsync('git checkout -b vlad/test-failsafe-case7', { cwd: tempDir });
      await invokeRouteSkill({
        skill: 'route.bind.set',
        args: { route: '.' },
        cwd: tempDir,
      });
      await fs.writeFile(
        path.join(tempDir, '7.both-malfunction.i1.md'),
        '# artifact\n\ntest content',
      );
      return { tempDir };
    });

    when('[t0] route.stone.set --as passed is invoked', () => {
      const result = useThen('both malfunction', async () =>
        invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '7.both-malfunction', as: 'passed' },
          cwd: scene.tempDir,
        }),
      );

      then('exit code is 2', () => {
        expect(result.code).toEqual(2);
      });

      then('passage is malfunction', () => {
        expect(result.stdout).toContain('passage = malfunction');
      });

      then('stderr shows review tree bucket', () => {
        expect(result.stderr).toContain('🔎 review 1');
        expect(result.stderr).toContain('├─ stdout');
        expect(result.stderr).toContain('├─ stderr');
      });

      then('stderr shows judge tree bucket', () => {
        expect(result.stderr).toContain('🪶 judge 1');
      });

      then('stderr shows both blocked by malfunction', () => {
        const malfunctionCount = (result.stderr.match(/blocked by malfunction/g) || []).length;
        expect(malfunctionCount).toEqual(2);
      });

      then('stderr shows both exit code 1 with explosion emoji', () => {
        const explosionCount = (result.stderr.match(/exit code: 1 💥/g) || []).length;
        expect(explosionCount).toEqual(2);
      });

      then('stdout matches snapshot', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });

      then('stderr matches snapshot', () => {
        expect(result.stderr).toMatchSnapshot();
      });
    });

    when('[t1] passage.jsonl is checked', () => {
      then('malfunction status is recorded', async () => {
        const passagePath = path.join(scene.tempDir, '.route', 'passage.jsonl');
        const content = await fs.readFile(passagePath, 'utf-8');
        const lines = content.split('\n').filter(Boolean);
        const entry = lines.find((line) => {
          const parsed = JSON.parse(line);
          return parsed.stone === '7.both-malfunction';
        });
        expect(entry).toBeDefined();
        const parsed = JSON.parse(entry!);
        expect(parsed.status).toEqual('malfunction');
      });
    });
  });
});
