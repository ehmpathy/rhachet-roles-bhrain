import * as fs from 'fs/promises';
import * as path from 'path';
import { given, then, useBeforeAll, useThen, when } from 'test-fns';

import {
  execAsync,
  genTempDirForRhachet,
  invokeRouteSkill,
  sanitizeTimeForSnapshot,
} from './.test/invokeRouteSkill';

const ASSETS_DIR = path.join(__dirname, '.test/assets/route-drive');

/**
 * .what = acceptance tests for self-review flow
 * .why = verifies clone must promise self-reviews before guards run
 */
describe('driver.route.self-review.acceptance', () => {
  given('[case1] stone with reviews.self defined', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDirForRhachet({
        slug: 'self-review-case1',
        clone: ASSETS_DIR,
      });

      // link the driver role
      await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });

      // create feature branch (bind rejects protected branches like main)
      await execAsync('git checkout -b vlad/test-self-review-case1', { cwd: tempDir });

      // make mock-review executable
      await execAsync('chmod +x .test/mock-review.sh', { cwd: tempDir });

      // create artifact for the stone
      await fs.writeFile(
        path.join(tempDir, '1.stone.i1.md'),
        '# Implementation\n\nFeature implemented.',
      );

      return { tempDir };
    });

    when('[t0] pass attempted without promises', () => {
      const result = useThen('blocked by self-review', async () =>
        invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1', route: '.', as: 'passed' },
          cwd: scene.tempDir,
        }),
      );

      then('exit code is non-zero', () => {
        expect(result.code).not.toEqual(0);
      });

      then('shows self-review required', () => {
        expect(result.stdout.toLowerCase()).toContain('self-review');
      });

      then('shows first review slug', () => {
        expect(result.stdout).toContain('all-done');
      });

      then('shows promise command', () => {
        expect(result.stdout).toContain('--as promised');
        expect(result.stdout).toContain('--that all-done');
      });

      then('stdout has good vibes', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });

    when('[t1] first review is promised', () => {
      const result = useThen('promise succeeds', async () =>
        invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1', route: '.', as: 'promised', that: 'all-done' },
          cwd: scene.tempDir,
        }),
      );

      then('exit code is 0', () => {
        expect(result.code).toEqual(0);
      });

      then('shows progress', () => {
        expect(result.stdout.toLowerCase()).toContain('progress');
      });

      then('shows next review', () => {
        expect(result.stdout).toContain('tests-pass');
      });

      then('stdout has good vibes', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });

    when('[t2] second review is promised', () => {
      const result = useThen('promise succeeds and guards run', async () => {
        // make review pass
        await fs.writeFile(path.join(scene.tempDir, '.test', 'review-should-pass'), '');
        return invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1', route: '.', as: 'promised', that: 'tests-pass' },
          cwd: scene.tempDir,
        });
      });

      then('exit code is 0', () => {
        expect(result.code).toEqual(0);
      });

      then('stdout has good vibes', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });

    when('[t3] pass attempted with all promises', () => {
      const result = useThen('guards execute', async () =>
        invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1', route: '.', as: 'passed' },
          cwd: scene.tempDir,
        }),
      );

      then('exit code is 0', () => {
        expect(result.code).toEqual(0);
      });

      then('shows guard tree', () => {
        expect(result.stdout.toLowerCase()).toContain('guard');
      });

      then('stdout has good vibes', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });
  });

  given('[case2] invalid promise slug', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDirForRhachet({
        slug: 'self-review-case2',
        clone: ASSETS_DIR,
      });

      // link the driver role
      await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });

      // create feature branch (bind rejects protected branches like main)
      await execAsync('git checkout -b vlad/test-self-review-case2', { cwd: tempDir });

      // create artifact for the stone
      await fs.writeFile(
        path.join(tempDir, '1.stone.i1.md'),
        '# Implementation\n\nFeature implemented.',
      );

      return { tempDir };
    });

    when('[t0] promise with invalid slug', () => {
      const result = useThen('shows error with valid options', async () =>
        invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1', route: '.', as: 'promised', that: 'invalid-slug' },
          cwd: scene.tempDir,
        }),
      );

      then('exit code is non-zero', () => {
        expect(result.code).not.toEqual(0);
      });

      then('shows valid slugs', () => {
        const output = result.stdout + result.stderr;
        expect(output).toContain('all-done');
        expect(output).toContain('tests-pass');
      });
    });
  });

  given('[case3] hash invalidation resets promises', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDirForRhachet({
        slug: 'self-review-case3',
        clone: ASSETS_DIR,
      });

      // link the driver role
      await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });

      // create feature branch (bind rejects protected branches like main)
      await execAsync('git checkout -b vlad/test-self-review-case3', {
        cwd: tempDir,
      });

      // make mock-review executable
      await execAsync('chmod +x .test/mock-review.sh', { cwd: tempDir });

      // create artifact for the stone
      await fs.writeFile(
        path.join(tempDir, '1.stone.i1.md'),
        '# Implementation\n\nFeature implemented.',
      );

      return { tempDir };
    });

    when('[t0] first review is promised', () => {
      const result = useThen('promise succeeds', async () =>
        invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1', route: '.', as: 'promised', that: 'all-done' },
          cwd: scene.tempDir,
        }),
      );

      then('exit code is 0', () => {
        expect(result.code).toEqual(0);
      });

      then('shows progress 1/2', () => {
        expect(result.stdout).toContain('1/2');
      });
    });

    when('[t1] artifact is edited (hash changes)', () => {
      then('artifact content changes', async () => {
        await fs.writeFile(
          path.join(scene.tempDir, '1.stone.i1.md'),
          '# Implementation\n\nFeature implemented with changes.',
        );
        // verify the file was updated
        const content = await fs.readFile(
          path.join(scene.tempDir, '1.stone.i1.md'),
          'utf-8',
        );
        expect(content).toContain('with changes');
      });
    });

    when('[t2] pass attempted after edit', () => {
      const result = useThen('blocked with invalidated status', async () =>
        invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1', route: '.', as: 'passed' },
          cwd: scene.tempDir,
        }),
      );

      then('exit code is non-zero', () => {
        expect(result.code).not.toEqual(0);
      });

      then('shows self-review required', () => {
        expect(result.stdout.toLowerCase()).toContain('self-review');
      });

      then('shows invalidated status', () => {
        expect(result.stdout.toLowerCase()).toContain('invalidated');
      });

      then('must re-promise from 1/2', () => {
        expect(result.stdout).toContain('1/2');
        expect(result.stdout).toContain('all-done');
      });

      then('stdout has good vibes', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });
  });

  given('[case4] flat reviews array (backwards compatible)', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDirForRhachet({
        slug: 'self-review-case4',
        clone: ASSETS_DIR,
      });

      // link the driver role
      await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });

      // create feature branch (bind rejects protected branches like main)
      await execAsync('git checkout -b vlad/test-self-review-case4', { cwd: tempDir });

      // make mock-review executable
      await execAsync('chmod +x .test/mock-review.sh', { cwd: tempDir });

      // overwrite guard with flat reviews array
      await fs.writeFile(
        path.join(tempDir, '1.stone.guard'),
        `artifacts:
  - 1.stone*.md

reviews:
  - .test/mock-review.sh --paths 1.stone*.md

judges:
  - rhx route.stone.judge --mechanism reviewed? --stone $stone --route $route --allow-blockers 0
`,
      );

      // create artifact
      await fs.writeFile(
        path.join(tempDir, '1.stone.i1.md'),
        '# Implementation\n\nFeature implemented.',
      );

      // make review pass
      await fs.writeFile(path.join(tempDir, '.test', 'review-should-pass'), '');

      return { tempDir };
    });

    when('[t0] pass attempted with flat reviews', () => {
      const result = useThen('guards execute directly (no self-review)', async () =>
        invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1', route: '.', as: 'passed' },
          cwd: scene.tempDir,
        }),
      );

      then('exit code is 0', () => {
        expect(result.code).toEqual(0);
      });

      then('shows guard tree', () => {
        expect(result.stdout.toLowerCase()).toContain('guard');
      });

      then('no self-review block', () => {
        expect(result.stdout.toLowerCase()).not.toContain('check yo');
      });

      then('stdout has good vibes', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });
  });
});
