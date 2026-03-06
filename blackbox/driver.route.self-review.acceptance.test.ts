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
 * .what = backdates triggered report mtime to bypass time enforcement
 * .why = tests need to verify promise flow without 30 second wait
 */
const backdateTriggeredReport = async (input: {
  tempDir: string;
  stone: string;
  slug: string;
}): Promise<void> => {
  // find ALL triggered report files for this slug (for hashbar check)
  const routeDir = path.join(input.tempDir, '.route');
  const files = await fs.readdir(routeDir).catch(() => []);
  const triggeredFiles = files.filter(
    (f) =>
      f.includes(`${input.stone}.guard.selfreview.${input.slug}`) &&
      f.endsWith('.triggered'),
  );
  // backdate all triggered files (needed for hashbar threshold check)
  const mtimePast = new Date(Date.now() - 31 * 1000);
  for (const triggeredFile of triggeredFiles) {
    const filepath = path.join(routeDir, triggeredFile);
    await fs.utimes(filepath, mtimePast, mtimePast);
  }
};

/**
 * .what = acceptance tests for review.self flow
 * .why = verifies clone must promise review.selfs before guards run
 */
describe('driver.route.review.self.acceptance', () => {
  given('[case1] stone with reviews.self defined', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDirForRhachet({
        slug: 'review.self-case1',
        clone: ASSETS_DIR,
      });

      // link the driver role
      await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });

      // create feature branch (bind rejects protected branches like main)
      await execAsync('git checkout -b vlad/test-review.self-case1', { cwd: tempDir });

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
      const result = useThen('blocked by review.self', async () =>
        invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1', route: '.', as: 'passed' },
          cwd: scene.tempDir,
        }),
      );

      then('exit code is non-zero', () => {
        expect(result.code).not.toEqual(0);
      });

      then('shows review.self required', () => {
        expect(result.stdout.toLowerCase()).toContain('review.self');
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
      const result = useThen('promise succeeds', async () => {
        // backdate triggered report to bypass time enforcement
        await backdateTriggeredReport({
          tempDir: scene.tempDir,
          stone: '1',
          slug: 'all-done',
        });
        return invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1', route: '.', as: 'promised', that: 'all-done' },
          cwd: scene.tempDir,
        });
      });

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
        // trigger tests-pass review (creates triggered report)
        await invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1', route: '.', as: 'passed' },
          cwd: scene.tempDir,
        });
        // backdate triggered report to bypass time enforcement
        await backdateTriggeredReport({
          tempDir: scene.tempDir,
          stone: '1',
          slug: 'tests-pass',
        });
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
        slug: 'review.self-case2',
        clone: ASSETS_DIR,
      });

      // link the driver role
      await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });

      // create feature branch (bind rejects protected branches like main)
      await execAsync('git checkout -b vlad/test-review.self-case2', { cwd: tempDir });

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

  given('[case3] hashless promises survive hash changes (firm checkpoint)', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDirForRhachet({
        slug: 'review.self-case3',
        clone: ASSETS_DIR,
      });

      // link the driver role
      await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });

      // create feature branch (bind rejects protected branches like main)
      await execAsync('git checkout -b vlad/test-review.self-case3', {
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
      const result = useThen('promise succeeds', async () => {
        // first call --as passed to trigger the report
        await invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1', route: '.', as: 'passed' },
          cwd: scene.tempDir,
        });
        // backdate triggered report to bypass time enforcement
        await backdateTriggeredReport({
          tempDir: scene.tempDir,
          stone: '1',
          slug: 'all-done',
        });
        return invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1', route: '.', as: 'promised', that: 'all-done' },
          cwd: scene.tempDir,
        });
      });

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
      const result = useThen('all-done still valid, tests-pass blocks', async () =>
        invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1', route: '.', as: 'passed' },
          cwd: scene.tempDir,
        }),
      );

      then('exit code is non-zero (tests-pass not promised yet)', () => {
        expect(result.code).not.toEqual(0);
      });

      then('shows review.self required', () => {
        expect(result.stdout.toLowerCase()).toContain('review.self');
      });

      then('shows tests-pass (not all-done)', () => {
        // all-done promise is firm (hashless), so we proceed to tests-pass
        expect(result.stdout).toContain('tests-pass');
        expect(result.stdout).toContain('2/2');
      });

      then('all-done promise remains valid', () => {
        // no invalidation status shown
        expect(result.stdout.toLowerCase()).not.toContain('invalidated');
      });

      then('stdout has good vibes', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });
  });

  given('[case4] flat reviews array (backwards compatible)', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDirForRhachet({
        slug: 'review.self-case4',
        clone: ASSETS_DIR,
      });

      // link the driver role
      await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });

      // create feature branch (bind rejects protected branches like main)
      await execAsync('git checkout -b vlad/test-review.self-case4', { cwd: tempDir });

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
      const result = useThen('guards execute directly (no review.self)', async () =>
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

      then('no review.self block', () => {
        expect(result.stdout.toLowerCase()).not.toContain('lets reflect');
      });

      then('stdout has good vibes', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });
  });

  given('[case5] clone promises too quickly (time enforcement)', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDirForRhachet({
        slug: 'review.self-case5',
        clone: ASSETS_DIR,
      });

      // link the driver role
      await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });

      // create feature branch (bind rejects protected branches like main)
      await execAsync('git checkout -b vlad/test-review.self-case5', {
        cwd: tempDir,
      });

      // create artifact for the stone
      await fs.writeFile(
        path.join(tempDir, '1.stone.i1.md'),
        '# Implementation\n\nFeature implemented.',
      );

      return { tempDir };
    });

    when('[t0] review.self is triggered', () => {
      const result = useThen('shows lets reflect prompt', async () =>
        invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1', route: '.', as: 'passed' },
          cwd: scene.tempDir,
        }),
      );

      then('shows review.self prompt', () => {
        expect(result.stdout).toContain('lets reflect');
      });
    });

    when('[t1] promise attempted immediately (before 30 seconds)', () => {
      const result = useThen('challenged by time enforcement', async () =>
        // no backdate — promise immediately after trigger
        invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1', route: '.', as: 'promised', that: 'all-done' },
          cwd: scene.tempDir,
        }),
      );

      then('exit code is non-zero', () => {
        expect(result.code).not.toEqual(0);
      });

      then('shows patience challenge', () => {
        expect(result.stdout).toContain('patience, friend');
      });

      then('shows pond barely rippled', () => {
        expect(result.stdout).toContain('pond barely rippled');
      });

      then('shows truly reflection', () => {
        expect(result.stdout).toContain('truly?');
      });

      then('shows pond awaits message', () => {
        expect(result.stdout).toContain('pond awaits');
      });

      then('stdout has good vibes', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });

    when('[t2] promise attempted after time passes (30+ seconds)', () => {
      const result = useThen('promise accepted', async () => {
        // backdate to simulate elapsed time
        await backdateTriggeredReport({
          tempDir: scene.tempDir,
          stone: '1',
          slug: 'all-done',
        });
        return invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1', route: '.', as: 'promised', that: 'all-done' },
          cwd: scene.tempDir,
        });
      });

      then('exit code is 0', () => {
        expect(result.code).toEqual(0);
      });

      then('shows progress', () => {
        expect(result.stdout).toContain('progressed');
      });
    });
  });

  given('[case6] hashbar controls timer behavior (not promise type)', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDirForRhachet({
        slug: 'self-review-case6',
        clone: ASSETS_DIR,
      });

      // link the driver role
      await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });

      // create feature branch
      await execAsync('git checkout -b vlad/test-self-review-case6', {
        cwd: tempDir,
      });

      // make mock-review executable
      await execAsync('chmod +x .test/mock-review.sh', { cwd: tempDir });

      // create artifact for the stone
      await fs.writeFile(
        path.join(tempDir, '1.stone.i1.md'),
        '# Implementation v1\n\nFeature implemented.',
      );

      return { tempDir };
    });

    when('[t0] all promises are hashless (no hash in filename)', () => {
      then('first promise creates hashless file', async () => {
        // trigger self-review
        await invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1', route: '.', as: 'passed' },
          cwd: scene.tempDir,
        });
        // backdate to bypass time enforcement
        await backdateTriggeredReport({
          tempDir: scene.tempDir,
          stone: '1',
          slug: 'all-done',
        });
        // promise
        const result = await invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1', route: '.', as: 'promised', that: 'all-done' },
          cwd: scene.tempDir,
        });
        expect(result.code).toEqual(0);

        // verify hashless promise was created (no hash in filename)
        const routeDir = path.join(scene.tempDir, '.route');
        const files = await fs.readdir(routeDir);
        const hashlessPromise = files.find(
          (f) =>
            f === '1.guard.promise.all-done.md', // exact match, no hash suffix
        );
        expect(hashlessPromise).toBeDefined();

        // verify NO hash-bound promise exists
        const hashBoundPromise = files.find(
          (f) =>
            f.startsWith('1.guard.promise.all-done.') &&
            f.match(/\.[a-f0-9]+\.md$/),
        );
        expect(hashBoundPromise).toBeUndefined();
      });
    });

    when('[t1] hashless promise survives hash changes', () => {
      then('promise remains valid after artifact edit', async () => {
        // change artifact (new hash)
        await fs.writeFile(
          path.join(scene.tempDir, '1.stone.i1.md'),
          '# Implementation v2\n\nFeature improved.',
        );

        // make review pass for tests-pass
        await fs.writeFile(
          path.join(scene.tempDir, '.test', 'review-should-pass'),
          '',
        );

        // attempt pass — should progress to tests-pass (all-done still valid)
        const result = await invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1', route: '.', as: 'passed' },
          cwd: scene.tempDir,
        });

        // should block on tests-pass, NOT all-done
        expect(result.stdout).toContain('tests-pass');
        expect(result.stdout).toContain('2/2');
      });
    });

    when('[t2] promise tests-pass and complete stone', () => {
      then('all self-reviews satisfied', async () => {
        // backdate tests-pass triggered report
        await backdateTriggeredReport({
          tempDir: scene.tempDir,
          stone: '1',
          slug: 'tests-pass',
        });

        // promise tests-pass
        const promiseResult = await invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1', route: '.', as: 'promised', that: 'tests-pass' },
          cwd: scene.tempDir,
        });
        expect(promiseResult.code).toEqual(0);

        // pass should now succeed (both reviews promised)
        const passResult = await invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1', route: '.', as: 'passed' },
          cwd: scene.tempDir,
        });
        expect(passResult.code).toEqual(0);
      });
    });
  });
});
