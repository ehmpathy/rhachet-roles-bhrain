import * as fs from 'fs/promises';
import * as path from 'path';
import { given, then, useBeforeAll, useThen, when } from 'test-fns';

import {
  execAsync,
  genTempDirForRhachet,
  invokeRouteSkill,
  sanitizeTimeForSnapshot,
} from './.test/invokeRouteSkill';

const ASSETS_DIR = path.join(__dirname, '.test/assets/route-peer-budget-multilevel');

/**
 * .what = acceptance tests for bulk budget extension and error paths
 * .why = matrix.5: `--peer absent | all reviewers affected`
 *        blueprint error path [e1]: invalid peer slug
 */
describe('driver.route.peer-budget-bulk.acceptance', () => {
  // ===========================================================================
  // BULK BUDGET EXTENSION (without --peer)
  // ===========================================================================

  given('[case1] bulk budget extension affects all peers', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDirForRhachet({
        slug: 'peer-budget-bulk',
        clone: ASSETS_DIR,
      });

      await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });
      await execAsync('chmod +x .test/mock-review-linter.sh', { cwd: tempDir });
      await execAsync('chmod +x .test/mock-review-spellcheck.sh', { cwd: tempDir });
      await execAsync('chmod +x .test/mock-review-architect.sh', { cwd: tempDir });

      return { tempDir };
    });

    when('[t0] artifact created, exhaust level 1 budgets', () => {
      const result = useThen('budgets consumed', async () => {
        await fs.mkdir(path.join(scene.tempDir, 'src'), { recursive: true });

        // exhaust linter budget (2 rounds)
        await fs.writeFile(path.join(scene.tempDir, 'src', 'feature.ts'), 'v1');
        await invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1.vision', route: '.', as: 'passed' },
          cwd: scene.tempDir,
        });

        await fs.writeFile(path.join(scene.tempDir, 'src', 'feature.ts'), 'v2');
        await invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1.vision', route: '.', as: 'passed' },
          cwd: scene.tempDir,
        });

        // exhaust spellcheck budget (3 rounds)
        await fs.writeFile(path.join(scene.tempDir, 'src', 'feature.ts'), 'v3');
        await invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1.vision', route: '.', as: 'passed' },
          cwd: scene.tempDir,
        });

        await fs.writeFile(path.join(scene.tempDir, 'src', 'feature.ts'), 'v4');
        await invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1.vision', route: '.', as: 'passed' },
          cwd: scene.tempDir,
        });

        await fs.writeFile(path.join(scene.tempDir, 'src', 'feature.ts'), 'v5');
        return invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1.vision', route: '.', as: 'passed' },
          cwd: scene.tempDir,
        });
      });

      then('both level 1 reviewers exhausted', () => {
        const output = result.stdout.toLowerCase();
        expect(output).toContain('exhaust');
      });
    });

    when('[t1] bulk budget extension (without --peer)', () => {
      const result = useThen('all peers extended', async () =>
        invokeRouteSkill({
          skill: 'route.guard.budget',
          args: { for: 'review', add: '2', route: '.', stone: '1.vision' },
          cwd: scene.tempDir,
        }),
      );

      then('exit code is 0', () => {
        expect(result.code).toEqual(0);
      });

      then('linter budget extended', () => {
        expect(result.stdout).toContain('linter');
      });

      then('spellcheck budget extended', () => {
        expect(result.stdout).toContain('spellcheck');
      });

      then('architect budget extended', () => {
        expect(result.stdout).toContain('architect');
      });

      then('stdout has good vibes', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });

    when('[t2] reviewers run again after bulk extension', () => {
      const result = useThen('reviewers active again', async () => {
        await fs.writeFile(path.join(scene.tempDir, 'src', 'feature.ts'), 'v6');
        return invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1.vision', route: '.', as: 'passed' },
          cwd: scene.tempDir,
        });
      });

      then('exit code is non-zero (blocked by review)', () => {
        expect(result.code).not.toEqual(0);
      });

      then('reviewer is NOT exhausted (has fresh budget)', () => {
        // linter should be back to rejected, not exhausted
        const output = result.stdout.toLowerCase();
        // some reviewers may still be exhausted if they didn't get enough budget
        // but at least one should be active
        expect(output).toContain('rejected');
      });

      then('stdout has good vibes', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });
  });

  // ===========================================================================
  // INVALID PEER SLUG ERROR PATH
  // ===========================================================================

  given('[case2] invalid peer slug returns clear error', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDirForRhachet({
        slug: 'peer-budget-invalid',
        clone: ASSETS_DIR,
      });

      await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });

      return { tempDir };
    });

    when('[t0] budget extension with invalid peer slug', () => {
      const result = useThen('error is returned', async () =>
        invokeRouteSkill({
          skill: 'route.guard.budget',
          args: { for: 'review', add: '2', route: '.', peer: 'nonexistent-peer', stone: '1.vision' },
          cwd: scene.tempDir,
        }),
      );

      then('exit code is 2 (constraint error)', () => {
        expect(result.code).toEqual(2);
      });

      then('error message mentions peer not found', () => {
        const combined = result.stdout + result.stderr;
        expect(combined.toLowerCase()).toMatch(/peer.*not found|not found.*peer/);
      });

      then('error message includes the invalid slug', () => {
        const combined = result.stdout + result.stderr;
        expect(combined).toContain('nonexistent-peer');
      });

      then('stderr has error output', () => {
        expect(sanitizeTimeForSnapshot(result.stderr)).toMatchSnapshot();
      });
    });
  });
});
