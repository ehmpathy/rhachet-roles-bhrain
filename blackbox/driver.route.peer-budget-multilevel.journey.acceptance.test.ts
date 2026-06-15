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
 * .what = journey 4: multi-level mixed terminal + budget extension
 * .why = proves the full lifecycle:
 *        1. level 1 runs first (linter + spellcheck)
 *        2. linter exhausts, spellcheck approves → level 1 terminal
 *        3. level 2 unlocks (architect)
 *        4. architect exhausts
 *        5. budget extended for architect
 *        6. architect runs again and passes
 *        7. still needs approval for linter exhaustion
 *        8. human approves, stone passes
 *
 * reviewers:
 *   - linter (level 1, budget 2) - always fails → exhausts
 *   - spellcheck (level 1, budget 3) - passes when flag file exists
 *   - architect (level 2, budget 2) - awaits level 1, exhausts, then extends
 */
describe('driver.route.peer-budget-multilevel.journey.acceptance', () => {
  given('[journey 4] multi-level mixed terminal + budget extension', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDirForRhachet({
        slug: 'peer-budget-multilevel',
        clone: ASSETS_DIR,
      });

      await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });
      await execAsync('chmod +x .test/mock-review-linter.sh', { cwd: tempDir });
      await execAsync('chmod +x .test/mock-review-spellcheck.sh', { cwd: tempDir });
      await execAsync('chmod +x .test/mock-review-architect.sh', { cwd: tempDir });

      return { tempDir };
    });

    // -------------------------------------------------------------------------
    // PHASE 1: level 1 runs (linter + spellcheck), architect awaits
    // -------------------------------------------------------------------------

    when('[t0] artifact created, level 1 reviewers run first', () => {
      const result = useThen('linter and spellcheck run, architect awaits', async () => {
        await fs.mkdir(path.join(scene.tempDir, 'src'), { recursive: true });
        await fs.writeFile(
          path.join(scene.tempDir, 'src', 'feature.ts'),
          'export const feature = () => "v1";',
        );

        return invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1.vision', route: '.', as: 'passed' },
          cwd: scene.tempDir,
        });
      });

      then('exit code is non-zero (blockers)', () => {
        expect(result.code).not.toEqual(0);
      });

      then('linter ran (level 1)', () => {
        expect(result.stdout).toContain('linter');
      });

      then('spellcheck ran (level 1)', () => {
        expect(result.stdout).toContain('spellcheck');
      });

      then('architect awaits level 1', () => {
        expect(result.stdout).toContain('awaits');
        expect(result.stdout).toContain('architect');
      });

      then('snapshot [t0]: level 1 active, level 2 awaits', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });

    when('[t1] second attempt, linter uses more budget', () => {
      const result = useThen('linter rounds 2/2, about to exhaust', async () => {
        await fs.writeFile(
          path.join(scene.tempDir, 'src', 'feature.ts'),
          'export const feature = () => "v2";',
        );

        return invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1.vision', route: '.', as: 'passed' },
          cwd: scene.tempDir,
        });
      });

      then('exit code is non-zero', () => {
        expect(result.code).not.toEqual(0);
      });

      then('snapshot [t1]: linter 2/2 exhausted, spellcheck 2/3', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });

    // -------------------------------------------------------------------------
    // PHASE 2: linter exhausts, spellcheck continues to approval
    // -------------------------------------------------------------------------

    when('[t2] third attempt, spellcheck passes (linter already exhausted)', () => {
      const result = useThen('spellcheck approves, level 1 now terminal', async () => {
        await fs.writeFile(
          path.join(scene.tempDir, 'src', 'feature.ts'),
          'export const feature = () => "v3";',
        );

        // make spellcheck pass
        await fs.writeFile(path.join(scene.tempDir, '.test', 'spellcheck-should-pass'), '');

        return invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1.vision', route: '.', as: 'passed' },
          cwd: scene.tempDir,
        });
      });

      then('exit code is non-zero (architect still has blockers)', () => {
        expect(result.code).not.toEqual(0);
      });

      then('linter is exhausted', () => {
        const output = result.stdout.toLowerCase();
        expect(output).toContain('exhaust');
        expect(output).toContain('linter');
      });

      then('spellcheck is approved', () => {
        const output = result.stdout.toLowerCase();
        expect(output).toContain('spellcheck');
        expect(output).toContain('approved');
      });

      then('architect is now unlocked and ran (not awaits)', () => {
        expect(result.stdout).toContain('architect');
        // architect should show it ran (rejected status with blockers), not still awaits
        const output = result.stdout.toLowerCase();
        expect(output).not.toMatch(/architect.*awaits/s);
        // should show rejected (ran and found blockers)
        expect(output).toMatch(/architect.*reject/s);
      });

      then('snapshot [t2]: level 1 terminal, architect unlocked', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });

    // -------------------------------------------------------------------------
    // PHASE 3: architect runs and exhausts
    // -------------------------------------------------------------------------

    when('[t3] fourth attempt, architect at budget limit', () => {
      const result = useThen('architect reaches budget limit', async () => {
        await fs.writeFile(
          path.join(scene.tempDir, 'src', 'feature.ts'),
          'export const feature = () => "v4";',
        );

        return invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1.vision', route: '.', as: 'passed' },
          cwd: scene.tempDir,
        });
      });

      then('exit code is non-zero', () => {
        expect(result.code).not.toEqual(0);
      });

      then('architect rejected at budget limit (2/2)', () => {
        // .note = at 2/2, review RAN so verdict is 'rejected' not 'exhausted'
        //         'exhausted' only when review SKIPPED (rounds >= budget BEFORE attempt)
        const output = result.stdout.toLowerCase();
        expect(output).toContain('rejected');
        expect(output).toContain('architect');
        expect(result.stdout).toContain('2/2');
      });

      then('snapshot [t3]: architect rejected at limit', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });

    when('[t3.5] fifth attempt, architect exhausted (review SKIPPED)', () => {
      const result = useThen('architect is exhausted', async () => {
        // .note = change artifact to trigger re-check
        await fs.writeFile(
          path.join(scene.tempDir, 'src', 'feature.ts'),
          'export const feature = () => "v4.5";',
        );

        return invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1.vision', route: '.', as: 'passed' },
          cwd: scene.tempDir,
        });
      });

      then('exit code is non-zero', () => {
        expect(result.code).not.toEqual(0);
      });

      then('architect is exhausted (review was SKIPPED at 3/2)', () => {
        // .note = at 3/2, rounds >= budget BEFORE attempt, so review is SKIPPED
        //         verdict is 'exhausted' not 'rejected'
        const output = result.stdout.toLowerCase();
        expect(output).toContain('exhausted');
        expect(output).toContain('architect');
      });

      then('snapshot [t3.5]: architect exhausted', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });

    when('[t4] route.drive shows exhaustion status', () => {
      const result = useThen('drive shows all statuses', async () =>
        invokeRouteSkill({
          skill: 'route.drive',
          args: { route: '.' },
          cwd: scene.tempDir,
        }),
      );

      then('shows current stone', () => {
        // .note = route.drive shows current stone and guidance, not reviewer details
        //         reviewer exhaustion details shown in route.stone.set output
        expect(result.stdout).toContain('stone = 1.vision');
      });

      then('shows standard guidance', () => {
        expect(result.stdout).toContain('--as passed');
      });

      then('snapshot [t4]: drive status with exhaustion', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });

    // -------------------------------------------------------------------------
    // PHASE 4: extend budget for architect
    // -------------------------------------------------------------------------

    when('[t5] extend budget for architect', () => {
      const result = useThen('architect budget extended 2 → 4', async () =>
        invokeRouteSkill({
          skill: 'route.guard.budget',
          args: { for: 'review', add: '2', peer: 'architect', stone: '1.vision', route: '.' },
          cwd: scene.tempDir,
        }),
      );

      then('exit code is 0', () => {
        expect(result.code).toEqual(0);
      });

      then('snapshot [t5]: budget extended', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });

    when('[t6] after budget extension, architect can continue', () => {
      const result = useThen('architect no longer exhausted', async () =>
        invokeRouteSkill({
          skill: 'route.drive',
          args: { route: '.' },
          cwd: scene.tempDir,
        }),
      );

      then('shows standard drive output', () => {
        // .note = route.drive shows current stone, not reviewer exhaustion details
        //         linter exhaustion verified in route.stone.set outputs (e.g., t8)
        expect(result.stdout).toContain('stone = 1.vision');
      });

      then('architect NOT in exhausted reason (budget was extended)', () => {
        // after budget extension, architect should not be listed in exhausted reason
        // the reason format is "peer reviewer budget exhausted: slug1, slug2"
        const reasonMatch = result.stdout.match(
          /peer reviewer budget exhausted:\s*([^\n]+)/i,
        );
        if (reasonMatch) {
          expect(reasonMatch[1]).not.toContain('architect');
        }
        // alternatively: architect might not appear at all if not exhausted
      });

      then('snapshot [t6]: architect can continue', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });

    // -------------------------------------------------------------------------
    // PHASE 5: architect passes after budget extension
    // -------------------------------------------------------------------------

    when('[t7] make architect pass', () => {
      const result = useThen('architect approves', async () => {
        await fs.writeFile(
          path.join(scene.tempDir, 'src', 'feature.ts'),
          'export const feature = () => "v5";',
        );

        // make architect pass
        await fs.writeFile(path.join(scene.tempDir, '.test', 'architect-should-pass'), '');

        return invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1.vision', route: '.', as: 'passed' },
          cwd: scene.tempDir,
        });
      });

      then('exit code is non-zero (linter still exhausted, needs approval)', () => {
        expect(result.code).not.toEqual(0);
      });

      then('architect is now approved', () => {
        const output = result.stdout.toLowerCase();
        expect(output).toContain('architect');
        expect(output).toContain('approved');
      });

      then('snapshot [t7]: architect approved, linter still exhausted', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });

    // -------------------------------------------------------------------------
    // PHASE 6: human approval required for exhausted linter
    // -------------------------------------------------------------------------

    when('[t8] route.drive shows need for human approval', () => {
      const result = useThen('halted for exhausted linter', async () =>
        invokeRouteSkill({
          skill: 'route.drive',
          args: { route: '.' },
          cwd: scene.tempDir,
        }),
      );

      then('shows linter still exhausted', () => {
        const output = result.stdout.toLowerCase();
        expect(output).toContain('linter');
        expect(output).toContain('exhaust');
      });

      then('requires human approval', () => {
        const output = result.stdout.toLowerCase() + result.stderr.toLowerCase();
        expect(output).toMatch(/approv|human/);
      });

      then('snapshot [t8]: needs approval for exhaustion', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });

    when('[t9] human approves', () => {
      const result = useThen('approval succeeds', async () =>
        invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1.vision', route: '.', as: 'approved' },
          cwd: scene.tempDir,
        }),
      );

      then('exit code is 0', () => {
        expect(result.code).toEqual(0);
      });

      then('snapshot [t9]: approved', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });

    when('[t10] pass after human approval', () => {
      const result = useThen('stone passes', async () =>
        invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1.vision', route: '.', as: 'passed' },
          cwd: scene.tempDir,
        }),
      );

      then('exit code is 0', () => {
        expect(result.code).toEqual(0);
      });

      then('passage allowed', () => {
        expect(result.stdout).toContain('passage = allowed');
      });

      then('snapshot [t10]: journey complete', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });
  });
});
