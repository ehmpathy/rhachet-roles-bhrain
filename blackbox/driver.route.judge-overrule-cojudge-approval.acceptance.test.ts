import * as fs from 'fs/promises';
import * as path from 'path';
import { given, then, useBeforeAll, useThen, when } from 'test-fns';

import {
  execAsync,
  genTempDirForRhachet,
  invokeRouteSkill,
  sanitizeTimeForSnapshot,
} from './.test/invokeRouteSkill';

const ASSETS_DIR = path.join(
  __dirname,
  '.test/assets/route-judge-malfunction-plus-approval',
);

/**
 * .what = acceptance test that a judge-rung overrule forgives ONLY the malfunctioned judge, never
 *         a co-judge that legitimately holds (an approved? sign-off gate).
 * .why = closes the r11 blocker: JUDGE_LEVEL collapses every guard.judges entry into one rung, so
 *        a stone-wide `judgeRungForgiven || every(passed)` let an overrule (placed to forgive a
 *        crashed judge) silently satisfy an unrelated approval gate — the exact skeleton-key defect
 *        the whole behavior exists to close, reincarnated one tier up. passage must scope
 *        forgiveness to the malfunction alone: the awaited approval still blocks until a human
 *        signs off (define.review.human-forgiveness.md).
 *
 * shape:
 *   - l1 basic-checker: always passes (0 blockers)
 *   - l3 premium-checker: always passes (0 blockers)
 *   - judge 1: a raw process that exits 1 (malfunction)
 *   - judge 2: approved? — a human sign-off gate (its own constraint exit when no approval exists)
 */
describe('driver.route.judge-overrule-cojudge-approval.acceptance', () => {
  given(
    '[case1] a judge malfunctions beside an approved? gate; human overrules the judge rung',
    () => {
      const scene = useBeforeAll(async () => {
        const tempDir = genTempDirForRhachet({
          slug: 'judge-overrule-cojudge-approval',
          clone: ASSETS_DIR,
        });

        await execAsync('npx rhachet roles link --role driver', {
          cwd: tempDir,
        });
        await execAsync('chmod +x .test/mock-review-l1.sh', { cwd: tempDir });
        await execAsync('chmod +x .test/mock-review-l3.sh', { cwd: tempDir });
        await execAsync('chmod +x .test/mock-judge-exit-1.sh', { cwd: tempDir });

        await fs.writeFile(
          path.join(tempDir, '1.feature.md'),
          '# Feature\n\nPeers pass; judge 1 crashes; judge 2 awaits sign-off.',
        );

        // run once so peers clear and the judge malfunction is on record
        await invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1.feature', route: '.', as: 'passed' },
          cwd: tempDir,
        });

        return { tempDir };
      });

      when('[t0] human overrules the judge rung, then a pass is attempted', () => {
        const result = useThen(
          'the pass stays blocked — the overrule forgave the crash, not the approval',
          async () => {
            await invokeRouteSkill({
              skill: 'route.stone.set',
              args: { stone: '1.feature', route: '.', as: 'overruled' },
              cwd: scene.tempDir,
            });
            return invokeRouteSkill({
              skill: 'route.stone.set',
              args: { stone: '1.feature', route: '.', as: 'passed' },
              cwd: scene.tempDir,
            });
          },
        );

        then('exit code is 2 (constraint block), not 1 (malfunction)', () => {
          // .why = the awaited approved? gate exits 2 (a legitimate constraint hold), so the pass
          //        blocks with exit 2 — a loose .not.toEqual(0) would let a malfunction (exit 1)
          //        masquerade as a legitimate block
          expect(result.code).toEqual(2);
        });

        then('passage is blocked, NOT overruled or allowed', () => {
          expect(result.stdout).toContain('passage = blocked');
          expect(result.stdout).not.toContain('passage = overruled');
          expect(result.stdout).not.toContain('passage = allowed');
        });

        then('the blocked reason names the untouched approval gate', () => {
          expect(result.stdout.toLowerCase()).toContain('approv');
        });

        then('snapshot matches', () => {
          expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
        });
      });
    },
  );

  given(
    '[case2] the human overrules the crash AND signs off — the stone then passes',
    () => {
      const scene = useBeforeAll(async () => {
        const tempDir = genTempDirForRhachet({
          slug: 'judge-overrule-cojudge-approval-recover',
          clone: ASSETS_DIR,
        });

        await execAsync('npx rhachet roles link --role driver', {
          cwd: tempDir,
        });
        await execAsync('chmod +x .test/mock-review-l1.sh', { cwd: tempDir });
        await execAsync('chmod +x .test/mock-review-l3.sh', { cwd: tempDir });
        await execAsync('chmod +x .test/mock-judge-exit-1.sh', { cwd: tempDir });

        await fs.writeFile(
          path.join(tempDir, '1.feature.md'),
          '# Feature\n\nPeers pass; judge 1 crashes; the human waves + signs off.',
        );

        // run once so peers clear and the judge malfunction is on record
        await invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1.feature', route: '.', as: 'passed' },
          cwd: tempDir,
        });

        return { tempDir };
      });

      when(
        '[t0] human overrules the judge rung, signs off, then a pass is attempted',
        () => {
          const result = useThen(
            'the pass succeeds as overruled once the approval gate is satisfied',
            async () => {
              await invokeRouteSkill({
                skill: 'route.stone.set',
                args: { stone: '1.feature', route: '.', as: 'overruled' },
                cwd: scene.tempDir,
              });
              await invokeRouteSkill({
                skill: 'route.stone.set',
                args: { stone: '1.feature', route: '.', as: 'approved' },
                cwd: scene.tempDir,
              });
              return invokeRouteSkill({
                skill: 'route.stone.set',
                args: { stone: '1.feature', route: '.', as: 'passed' },
                cwd: scene.tempDir,
              });
            },
          );

          then('exit code is 0', () => {
            expect(result.code).toEqual(0);
          });

          then('passage is overruled', () => {
            expect(result.stdout).toContain('passage = overruled');
          });

          then('snapshot matches', () => {
            expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
          });
        },
      );
    },
  );
});
