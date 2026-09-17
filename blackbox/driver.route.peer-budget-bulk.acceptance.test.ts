import * as fs from 'fs/promises';
import * as path from 'path';
import { given, then, useBeforeAll, useThen, when } from 'test-fns';

import { answerEveryPeerGiven } from './.test/answerEveryPeerGiven';
import {
  execAsync,
  genTempDirForRhachet,
  invokeRouteSkill,
  sanitizeTimeForSnapshot,
} from './.test/invokeRouteSkill';

const ASSETS_DIR = path.join(__dirname, '.test/assets/route-peer-budget-multilevel');

/**
 * .what = acceptance tests for bulk budget extension, the F022 fork-E level scope, and error paths
 * .why = F022 fork E: a bare `--add` lands on the LATEST level alone; a lower level is reached ONLY
 *        when named with `--level` (or a lane with `--peer`). a blanket sweep that silently heals an
 *        exhausted lower level is the harm the wisher forecloses.
 *        blueprint error path [e1]: invalid peer slug
 */
describe('driver.route.peer-budget-bulk.acceptance', () => {
  // ===========================================================================
  // BULK BUDGET EXTENSION — F022 fork E (latest level by default, --level to reach lower)
  // ===========================================================================

  given('[case1] a bulk add lands on the latest level, not every level', () => {
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
        await answerEveryPeerGiven({ cwd: scene.tempDir, stone: '1.vision', severity: 'urgent' });
        await invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1.vision', route: '.', as: 'passed' },
          cwd: scene.tempDir,
        });

        await fs.writeFile(path.join(scene.tempDir, 'src', 'feature.ts'), 'v2');
        await answerEveryPeerGiven({ cwd: scene.tempDir, stone: '1.vision', severity: 'urgent' });
        await invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1.vision', route: '.', as: 'passed' },
          cwd: scene.tempDir,
        });

        // exhaust spellcheck budget (3 rounds)
        await fs.writeFile(path.join(scene.tempDir, 'src', 'feature.ts'), 'v3');
        await answerEveryPeerGiven({ cwd: scene.tempDir, stone: '1.vision', severity: 'urgent' });
        await invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1.vision', route: '.', as: 'passed' },
          cwd: scene.tempDir,
        });

        await fs.writeFile(path.join(scene.tempDir, 'src', 'feature.ts'), 'v4');
        await answerEveryPeerGiven({ cwd: scene.tempDir, stone: '1.vision', severity: 'urgent' });
        await invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1.vision', route: '.', as: 'passed' },
          cwd: scene.tempDir,
        });

        await fs.writeFile(path.join(scene.tempDir, 'src', 'feature.ts'), 'v5');
        // answer whatever the prior round left owed, before this one is entered.
        // a no-op on the first arrival; on every later one it is what the entrance
        // gate now requires — an edit alone no longer buys re-entry
        await answerEveryPeerGiven({ cwd: scene.tempDir, stone: '1.vision', severity: 'urgent' });

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

      then('the pre-extension tree is pinned — both l1 reviewers exhausted at their own budgets', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });

    when('[t1] bulk budget extension (bare — no --peer, no --level)', () => {
      const result = useThen('the latest level alone is extended', async () =>
        invokeRouteSkill({
          skill: 'route.guard.budget',
          args: { for: 'review', add: '2', route: '.', stone: '1.vision' },
          cwd: scene.tempDir,
        }),
      );

      then('exit code is 0', () => {
        expect(result.code).toEqual(0);
      });

      then('architect (the latest level, l2) is extended', () => {
        // the deepest level in play gets the bare add
        expect(result.stdout).toContain('architect');
      });

      then('the exhausted l1 linter is NOT extended — it stays exhausted (fork E)', () => {
        // 🔴 red under the overturned blanket behavior — a bare add used to heal every level,
        //    silently resurrecting the l1 budget the route author bounded on purpose
        const updates = result.stdout.split('updates')[1] ?? '';
        expect(updates).not.toContain('linter');
      });

      then('the exhausted l1 spellcheck is NOT extended — it stays exhausted (fork E)', () => {
        const updates = result.stdout.split('updates')[1] ?? '';
        expect(updates).not.toContain('spellcheck');
      });

      then('stdout has good vibes', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });

    when('[t1b] an explicit --level 1 reaches the lower level on purpose', () => {
      const result = useThen('the named lower level is extended', async () =>
        invokeRouteSkill({
          skill: 'route.guard.budget',
          args: { for: 'review', add: '2', route: '.', stone: '1.vision', level: '1' },
          cwd: scene.tempDir,
        }),
      );

      then('exit code is 0', () => {
        expect(result.code).toEqual(0);
      });

      then('linter (l1) is extended — the driver named the level', () => {
        // 🔴 red without the --level branch — a driver could not reach a lower level at all
        const updates = result.stdout.split('updates')[1] ?? '';
        expect(updates).toContain('linter');
      });

      then('spellcheck (l1) is extended', () => {
        const updates = result.stdout.split('updates')[1] ?? '';
        expect(updates).toContain('spellcheck');
      });

      then('architect (l2) is NOT extended — it sits outside the named level', () => {
        const updates = result.stdout.split('updates')[1] ?? '';
        expect(updates).not.toContain('architect');
      });

      then('stdout has good vibes', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });

    when('[t1c] an explicit --level names a level no lane sits at', () => {
      const result = useThen('the error names the levels in play', async () =>
        invokeRouteSkill({
          skill: 'route.guard.budget',
          args: { for: 'review', add: '2', route: '.', stone: '1.vision', level: '9' },
          cwd: scene.tempDir,
        }),
      );

      then('exit code is 2 (constraint error)', () => {
        expect(result.code).toEqual(2);
      });

      then('the error names the absent level and the levels in play', () => {
        const combined = (result.stdout + result.stderr).toLowerCase();
        expect(combined).toContain('no reviewer at level 9');
      });

      then('the full error body is pinned', () => {
        expect(sanitizeTimeForSnapshot(result.stdout + result.stderr)).toMatchSnapshot();
      });
    });

    when('[t2] reviewers run again after bulk extension', () => {
      const result = useThen('reviewers active again', async () => {
        await fs.writeFile(path.join(scene.tempDir, 'src', 'feature.ts'), 'v6');
        // answer whatever the prior round left owed, before this one is entered.
        // a no-op on the first arrival; on every later one it is what the entrance
        // gate now requires — an edit alone no longer buys re-entry
        await answerEveryPeerGiven({ cwd: scene.tempDir, stone: '1.vision', severity: 'urgent' });

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
        const output = result.stdout.toLowerCase();
        // a fresh-budget reviewer RUNS and rejects; an exhausted one renders
        // `exhausted 🌙` and never runs. the helper concedes each round (the
        // default norm), so the stance gate is cleared, the reviewers run fresh,
        // and the round ends at the JUDGE halt — a real `rejected` verdict, not a
        // stance prompt. so prove fresh budget by the live `rejected` plus the
        // absence of exhaustion.
        expect(output).toContain('rejected');
        expect(output).not.toContain('exhausted');
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
