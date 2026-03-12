import * as fs from 'fs/promises';
import * as path from 'path';
import { given, then, useBeforeAll, useThen, when } from 'test-fns';

import {
  execAsync,
  genTempDirForRhachet,
  invokeRouteSkill,
} from './.test/invokeRouteSkill';

const ASSETS_DIR = path.join(__dirname, '.test/assets/route-bouncer');

/**
 * .what = route.bounce acceptance tests for artifact gate enforcement
 * .why = proves that protected artifacts are blocked until stone passes
 */
describe('driver.route.bounce.acceptance', () => {
  given('[case1] guard with protect: directive for src/**/*.ts', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDirForRhachet({
        slug: 'bounce-blocked',
        clone: ASSETS_DIR,
      });

      // link the driver role
      await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });

      // create feature branch (bind rejects protected branches)
      await execAsync('git checkout -b vlad/test-bounce', { cwd: tempDir });

      // bind the route
      await execAsync('npx rhx route.bind.set --route .', { cwd: tempDir });

      // trigger bouncer cache precompute via route.drive
      await invokeRouteSkill({
        skill: 'route.drive',
        args: {},
        cwd: tempDir,
      });

      return { tempDir };
    });

    when('[t0] route.bounce --mode hook --path src/feature.ts', () => {
      const result = useThen('returns blocked', async () =>
        invokeRouteSkill({
          skill: 'route.bounce',
          args: { mode: 'hook', path: 'src/feature.ts' },
          cwd: scene.tempDir,
        }),
      );

      then('exit code is 2 (blocked)', () => {
        expect(result.code).toEqual(2);
      });

      then('output contains blocked feedback', () => {
        expect(result.stdout).toContain('blocked');
        expect(result.stdout).toContain('artifact = src/feature.ts');
      });
    });

    when('[t1] route.bounce --mode hook --path unprotected.txt', () => {
      const result = useThen('returns allowed', async () =>
        invokeRouteSkill({
          skill: 'route.bounce',
          args: { mode: 'hook', path: 'unprotected.txt' },
          cwd: scene.tempDir,
        }),
      );

      then('exit code is 0 (allowed)', () => {
        expect(result.code).toEqual(0);
      });
    });
  });

  given('[case2] driver receives actionable feedback', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDirForRhachet({
        slug: 'bounce-feedback',
        clone: ASSETS_DIR,
      });

      await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });
      await execAsync('git checkout -b vlad/test-bounce', { cwd: tempDir });
      await execAsync('npx rhx route.bind.set --route .', { cwd: tempDir });
      await invokeRouteSkill({
        skill: 'route.drive',
        args: {},
        cwd: tempDir,
      });

      return { tempDir };
    });

    when('[t0] route.bounce blocks src/feature.ts', () => {
      const result = useThen('blocked with feedback', async () =>
        invokeRouteSkill({
          skill: 'route.bounce',
          args: { mode: 'hook', path: 'src/feature.ts' },
          cwd: scene.tempDir,
        }),
      );

      then('feedback includes guard name', () => {
        expect(result.stdout).toContain('1.blueprint.guard');
      });

      then('feedback includes stone name', () => {
        expect(result.stdout).toContain('1.blueprint');
      });

      then('feedback includes instructions', () => {
        expect(result.stdout).toContain('rhx route.drive');
      });

      then('stdout matches snapshot', () => {
        expect(result.stdout).toMatchSnapshot();
      });
    });
  });

  given('[case3] stone passage releases protection', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDirForRhachet({
        slug: 'bounce-release',
        clone: ASSETS_DIR,
      });

      await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });
      await execAsync('git checkout -b vlad/test-bounce', { cwd: tempDir });
      await execAsync('npx rhx route.bind.set --route .', { cwd: tempDir });
      await invokeRouteSkill({
        skill: 'route.drive',
        args: {},
        cwd: tempDir,
      });

      return { tempDir };
    });

    when('[t0] before stone passes', () => {
      const result = useThen('src/feature.ts is blocked', async () =>
        invokeRouteSkill({
          skill: 'route.bounce',
          args: { mode: 'hook', path: 'src/feature.ts' },
          cwd: scene.tempDir,
        }),
      );

      then('blocked', () => {
        expect(result.code).toEqual(2);
      });
    });

    when('[t1] stone is passed', () => {
      const result = useThen('stone pass succeeds', async () => {
        // create artifact
        await fs.writeFile(
          path.join(scene.tempDir, '1.blueprint.md'),
          '# Blueprint\n\nThe plan.',
        );

        // pass the stone
        return invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1.blueprint', route: '.', as: 'passed' },
          cwd: scene.tempDir,
        });
      });

      then('pass succeeds', () => {
        expect(result.code).toEqual(0);
      });
    });

    when('[t2] after stone passes', () => {
      const result = useThen('src/feature.ts is allowed', async () =>
        invokeRouteSkill({
          skill: 'route.bounce',
          args: { mode: 'hook', path: 'src/feature.ts' },
          cwd: scene.tempDir,
        }),
      );

      then('allowed', () => {
        expect(result.code).toEqual(0);
      });
    });
  });

  given('[case4] escape hatch via guard edit + route.drive', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDirForRhachet({
        slug: 'bounce-escape',
        clone: ASSETS_DIR,
      });

      await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });
      await execAsync('git checkout -b vlad/test-bounce', { cwd: tempDir });
      await execAsync('npx rhx route.bind.set --route .', { cwd: tempDir });
      await invokeRouteSkill({
        skill: 'route.drive',
        args: {},
        cwd: tempDir,
      });

      return { tempDir };
    });

    when('[t0] initially blocked', () => {
      const result = useThen('src/feature.ts is blocked', async () =>
        invokeRouteSkill({
          skill: 'route.bounce',
          args: { mode: 'hook', path: 'src/feature.ts' },
          cwd: scene.tempDir,
        }),
      );

      then('blocked', () => {
        expect(result.code).toEqual(2);
      });
    });

    when('[t1] human removes protect: from guard', () => {
      const result = useThen('guard is edited', async () => {
        // remove protect: section from guard
        await fs.writeFile(
          path.join(scene.tempDir, '1.blueprint.guard'),
          [
            'artifacts:',
            '  - 1.blueprint*.md',
            'reviews:',
            '  - echo "blockers: 0\\nnitpicks: 0\\ntest review content"',
            'judges:',
            '  - echo "passed: true\\nreason: all checks passed"',
          ].join('\n'),
        );

        // trigger cache recompute via route.drive
        await invokeRouteSkill({
          skill: 'route.drive',
          args: {},
          cwd: scene.tempDir,
        });

        return { edited: true };
      });

      then('guard is edited', () => {
        expect(result.edited).toBe(true);
      });
    });

    when('[t2] after escape hatch', () => {
      const result = useThen('src/feature.ts is allowed', async () =>
        invokeRouteSkill({
          skill: 'route.bounce',
          args: { mode: 'hook', path: 'src/feature.ts' },
          cwd: scene.tempDir,
        }),
      );

      then('allowed', () => {
        expect(result.code).toEqual(0);
      });
    });
  });

  given('[case5] multiple guards protect same artifact', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDirForRhachet({
        slug: 'bounce-multi-guard',
        clone: ASSETS_DIR,
      });

      // add protect: directive to second guard (first guard already has it)
      await fs.writeFile(
        path.join(tempDir, '2.execute.guard'),
        [
          'artifacts:',
          '  - 2.execute*.md',
          'reviews:',
          '  - echo "blockers: 0\\nnitpicks: 0\\ntest review content"',
          'judges:',
          '  - echo "passed: true\\nreason: all checks passed"',
          'protect:',
          '  - src/**/*.ts',
        ].join('\n'),
      );

      await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });
      await execAsync('git checkout -b vlad/test-bounce', { cwd: tempDir });
      await execAsync('npx rhx route.bind.set --route .', { cwd: tempDir });
      await invokeRouteSkill({
        skill: 'route.drive',
        args: {},
        cwd: tempDir,
      });

      return { tempDir };
    });

    when('[t0] both guards unpassed', () => {
      const result = useThen('src/feature.ts is blocked', async () =>
        invokeRouteSkill({
          skill: 'route.bounce',
          args: { mode: 'hook', path: 'src/feature.ts' },
          cwd: scene.tempDir,
        }),
      );

      then('blocked', () => {
        expect(result.code).toEqual(2);
      });
    });

    when('[t1] first guard (1.blueprint) passed', () => {
      const result = useThen('src/feature.ts is still blocked', async () => {
        // create artifact and pass first stone
        await fs.writeFile(
          path.join(scene.tempDir, '1.blueprint.md'),
          '# Blueprint\n\nThe plan.',
        );
        await invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1.blueprint', route: '.', as: 'passed' },
          cwd: scene.tempDir,
        });

        // check if still blocked (second guard not passed)
        return invokeRouteSkill({
          skill: 'route.bounce',
          args: { mode: 'hook', path: 'src/feature.ts' },
          cwd: scene.tempDir,
        });
      });

      then('still blocked (second guard not passed)', () => {
        expect(result.code).toEqual(2);
      });
    });

    when('[t2] both guards passed', () => {
      const result = useThen('src/feature.ts is allowed', async () => {
        // create artifact and pass second stone
        await fs.writeFile(
          path.join(scene.tempDir, '2.execute.md'),
          '# Execute\n\nThe execution.',
        );
        await invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '2.execute', route: '.', as: 'passed' },
          cwd: scene.tempDir,
        });

        // check if now allowed
        return invokeRouteSkill({
          skill: 'route.bounce',
          args: { mode: 'hook', path: 'src/feature.ts' },
          cwd: scene.tempDir,
        });
      });

      then('allowed (both guards passed)', () => {
        expect(result.code).toEqual(0);
      });
    });
  });

  given('[case6] no protection declared', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDirForRhachet({
        slug: 'bounce-none',
        clone: ASSETS_DIR,
      });

      await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });
      await execAsync('git checkout -b vlad/test-bounce', { cwd: tempDir });
      await execAsync('npx rhx route.bind.set --route .', { cwd: tempDir });

      // remove all protect: directives from guards
      await fs.writeFile(
        path.join(tempDir, '1.blueprint.guard'),
        [
          'artifacts:',
          '  - 1.blueprint*.md',
          'reviews: []',
          'judges: []',
        ].join('\n'),
      );

      await invokeRouteSkill({
        skill: 'route.drive',
        args: {},
        cwd: tempDir,
      });

      return { tempDir };
    });

    when('[t0] route.bounce --mode hook --path src/feature.ts', () => {
      const result = useThen('allowed (no protection)', async () =>
        invokeRouteSkill({
          skill: 'route.bounce',
          args: { mode: 'hook', path: 'src/feature.ts' },
          cwd: scene.tempDir,
        }),
      );

      then('allowed', () => {
        expect(result.code).toEqual(0);
      });
    });

    when('[t1] route.bounce (list mode)', () => {
      const result = useThen('shows no protections', async () =>
        invokeRouteSkill({
          skill: 'route.bounce',
          args: {},
          cwd: scene.tempDir,
        }),
      );

      then('shows no protected artifacts', () => {
        expect(result.stdout).toContain('no protected artifacts');
      });
    });
  });

  given('[case7] protection scoped to bound routes only', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDirForRhachet({
        slug: 'bounce-scoped',
        clone: ASSETS_DIR,
      });

      // create route-a with protect: src/**/*.ts
      await fs.mkdir(path.join(tempDir, 'route-a'), { recursive: true });
      await fs.writeFile(
        path.join(tempDir, 'route-a', '1.design.guard'),
        [
          'artifacts:',
          '  - 1.design*.md',
          'reviews:',
          '  - echo "blockers: 0\\nnitpicks: 0\\ntest review content"',
          'judges:',
          '  - echo "passed: true\\nreason: all checks passed"',
          'protect:',
          '  - src/**/*.ts',
        ].join('\n'),
      );
      await fs.writeFile(
        path.join(tempDir, 'route-a', '1.design.stone'),
        'stone: 1.design\n',
      );

      // create route-b (NOT bound) with protect: tests/**/*.ts
      await fs.mkdir(path.join(tempDir, 'route-b'), { recursive: true });
      await fs.writeFile(
        path.join(tempDir, 'route-b', '1.plan.guard'),
        [
          'artifacts:',
          '  - 1.plan*.md',
          'reviews:',
          '  - echo "blockers: 0\\nnitpicks: 0\\ntest review content"',
          'judges:',
          '  - echo "passed: true\\nreason: all checks passed"',
          'protect:',
          '  - tests/**/*.ts',
        ].join('\n'),
      );
      await fs.writeFile(
        path.join(tempDir, 'route-b', '1.plan.stone'),
        'stone: 1.plan\n',
      );

      // create tests directory
      await fs.mkdir(path.join(tempDir, 'tests'), { recursive: true });
      await fs.writeFile(
        path.join(tempDir, 'tests', 'feature.test.ts'),
        'test file',
      );

      await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });
      await execAsync('git checkout -b vlad/test-bounce', { cwd: tempDir });

      // bind ONLY route-a (route-b is not bound)
      await execAsync('npx rhx route.bind.set --route route-a', {
        cwd: tempDir,
      });

      // trigger cache precompute
      await invokeRouteSkill({
        skill: 'route.drive',
        args: {},
        cwd: tempDir,
      });

      return { tempDir };
    });

    when('[t0] only route-a bound', () => {
      const srcResult = useThen('src/feature.ts is blocked', async () =>
        invokeRouteSkill({
          skill: 'route.bounce',
          args: { mode: 'hook', path: 'src/feature.ts' },
          cwd: scene.tempDir,
        }),
      );

      const testsResult = useThen('tests/feature.test.ts is allowed', async () =>
        invokeRouteSkill({
          skill: 'route.bounce',
          args: { mode: 'hook', path: 'tests/feature.test.ts' },
          cwd: scene.tempDir,
        }),
      );

      then('src is blocked (route-a bound, protects src)', () => {
        expect(srcResult.code).toEqual(2);
        expect(srcResult.stdout).toContain('1.design');
      });

      then('tests is allowed (route-b not bound)', () => {
        expect(testsResult.code).toEqual(0);
      });
    });

    when('[t1] route-a stone passed', () => {
      const result = useThen('src released', async () => {
        // pass route-a stone
        await fs.writeFile(
          path.join(scene.tempDir, 'route-a', '1.design.md'),
          '# Design\n\nThe design.',
        );
        await invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1.design', route: 'route-a', as: 'passed' },
          cwd: scene.tempDir,
        });

        // check src path
        return invokeRouteSkill({
          skill: 'route.bounce',
          args: { mode: 'hook', path: 'src/feature.ts' },
          cwd: scene.tempDir,
        });
      });

      then('src is allowed (route-a passed)', () => {
        expect(result.code).toEqual(0);
      });
    });
  });

  given('[case8] journey: blocked → pass stone → allowed', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDirForRhachet({
        slug: 'bounce-journey',
        clone: ASSETS_DIR,
      });

      await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });
      await execAsync('git checkout -b vlad/test-bounce', { cwd: tempDir });
      await execAsync('npx rhx route.bind.set --route .', { cwd: tempDir });
      await invokeRouteSkill({
        skill: 'route.drive',
        args: {},
        cwd: tempDir,
      });

      return { tempDir };
    });

    when('[t0] journey executes sequentially', () => {
      then('completes full flow from blocked → pass → allowed', async () => {
        // phase 1: blocked
        const blocked = await invokeRouteSkill({
          skill: 'route.bounce',
          args: { mode: 'hook', path: 'src/feature.ts' },
          cwd: scene.tempDir,
        });
        expect(blocked.code).toEqual(2);
        expect(blocked.stdout).toContain('blocked');
        expect(blocked.stdout).toMatchSnapshot('blocked feedback');

        // phase 2: list protections
        const list = await invokeRouteSkill({
          skill: 'route.bounce',
          args: {},
          cwd: scene.tempDir,
        });
        expect(list.code).toEqual(0);
        expect(list.stdout).toContain('1.blueprint');
        expect(list.stdout).toMatchSnapshot('protection list');

        // phase 3: create artifact and pass stone
        await fs.writeFile(
          path.join(scene.tempDir, '1.blueprint.md'),
          '# Blueprint\n\nThe plan for the feature.',
        );
        const pass = await invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1.blueprint', route: '.', as: 'passed' },
          cwd: scene.tempDir,
        });
        expect(pass.code).toEqual(0);

        // phase 4: allowed
        const allowed = await invokeRouteSkill({
          skill: 'route.bounce',
          args: { mode: 'hook', path: 'src/feature.ts' },
          cwd: scene.tempDir,
        });
        expect(allowed.code).toEqual(0);

        // phase 5: list shows passed
        const listAfter = await invokeRouteSkill({
          skill: 'route.bounce',
          args: {},
          cwd: scene.tempDir,
        });
        expect(listAfter.stdout).toContain('✓');
        expect(listAfter.stdout).toMatchSnapshot('protection list after pass');
      });
    });
  });
});
