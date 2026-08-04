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
  '.test/assets/route-judge-malfunction-peer',
);

/**
 * .what = acceptance test for an overrule of a malfunctioned judge on a peer+judge stone
 * .why = closes the r11 finding-1 gap: once both peer levels clear, the judge is the top
 *        rung of the guard ladder. a judge malfunction must be recoverable — a human
 *        overrules the judge rung (JUDGE_LEVEL) and the stone passes as overruled. before
 *        the fix, no path could target the judge rung on a peer+judge stone, so a judge
 *        malfunction was a permanent block with no admin escape.
 *
 * shape:
 *   - l1 basic-checker: always passes (0 blockers)
 *   - l3 premium-checker: always passes (0 blockers)
 *   - judge: a raw process that exits 1 (malfunction)
 */
describe('driver.route.judge-overrule-peer.acceptance', () => {
  given(
    '[case1] peers pass, the judge malfunctions, human overrules the judge rung',
    () => {
      const scene = useBeforeAll(async () => {
        const tempDir = genTempDirForRhachet({
          slug: 'judge-overrule-peer',
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
          '# Feature\n\nPeers pass; the judge process itself crashes.',
        );

        return { tempDir };
      });

      when('[t0] initial pass attempted (peers pass, judge malfunctions)', () => {
        const result = useThen(
          'pass fails due to judge malfunction',
          async () =>
            invokeRouteSkill({
              skill: 'route.stone.set',
              args: { stone: '1.feature', route: '.', as: 'passed' },
              cwd: scene.tempDir,
            }),
        );

        then('exit code is 2 (constraint block), not 1', () => {
          // .why = a malfunctioned judge yields passage = malfunction, which blocks the stone with
          //        exit 2 (a human must overrule) — pin the precise code, not merely non-zero
          expect(result.code).toEqual(2);
        });

        then('passage is malfunction', () => {
          expect(result.stdout).toContain('passage = malfunction');
        });

        then('both peer reviewers ran and cleared', () => {
          expect(result.stdout).toContain('basic-checker');
          expect(result.stdout).toContain('premium-checker');
        });

        then('snapshot matches', () => {
          expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
        });
      });

      when('[t1] human overrules the judge rung', () => {
        const result = useThen('overrule succeeds', async () =>
          invokeRouteSkill({
            skill: 'route.stone.set',
            args: { stone: '1.feature', route: '.', as: 'overruled' },
            cwd: scene.tempDir,
          }),
        );

        then('exit code is 0', () => {
          expect(result.code).toEqual(0);
        });

        then('stdout names the judge rung as overruled', () => {
          expect(result.stdout).toContain('judge, overruled');
        });

        then('snapshot shows the judge overrule', () => {
          expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
        });
      });

      when('[t2] pass attempted after the judge overrule', () => {
        const result = useThen('pass succeeds as overruled', async () => {
          // overrule the judge rung (idempotent), then pass
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
        });

        then('exit code is 0', () => {
          expect(result.code).toEqual(0);
        });

        then('stdout confirms passage as overruled', () => {
          expect(result.stdout).toContain('passage = overruled');
        });

        then(
          'the live judge line reads malfunction, never a contradictory blocked',
          () => {
            // the live tree (🦉) must not call a forgiven judge `blocked` while the
            // persisted tree (🗿) calls it `overruled ✓ — forgiven`. a malfunctioned
            // judge reads as `💥 … malfunction` in both the live and persisted views.
            expect(result.stdout).not.toContain('✗ judge.1 - blocked');
            expect(result.stdout).toContain('malfunction');
            expect(result.stdout).toContain('overruled ✓ — forgiven by human');
          },
        );

        then('snapshot matches', () => {
          expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
        });
      });
    },
  );

  given(
    '[case2] human forces the malfunctioned judge rung on a peer+judge stone',
    () => {
      const scene = useBeforeAll(async () => {
        const tempDir = genTempDirForRhachet({
          slug: 'judge-force-peer',
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
          '# Feature\n\nPeers pass; the judge crashes; human forces.',
        );

        // run once so peers clear and the judge malfunction is on record
        await invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1.feature', route: '.', as: 'passed' },
          cwd: tempDir,
        });

        return { tempDir };
      });

      when('[t0] human forces the judge rung', () => {
        const result = useThen('force succeeds', async () =>
          invokeRouteSkill({
            skill: 'route.stone.set',
            args: { stone: '1.feature', route: '.', as: 'forced' },
            cwd: scene.tempDir,
          }),
        );

        then('exit code is 0', () => {
          expect(result.code).toEqual(0);
        });

        then('stdout shows both approval and overrule', () => {
          expect(result.stdout).toContain('approved');
          expect(result.stdout).toContain('overruled');
        });

        then(
          'the forced overrule names the judge rung, never the raw sentinel',
          () => {
            // .why = a judge-rung force must read "overruled = ✓ (judge)", never
            //        "(level 9007199254740991)" — the JUDGE_LEVEL sentinel must never reach a human
            expect(result.stdout).toContain('(judge)');
            expect(result.stdout).not.toContain('9007199254740991');
          },
        );

        then('snapshot shows the judge-rung force (approval + overrule)', () => {
          expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
        });
      });

      when('[t1] pass attempted after force', () => {
        const result = useThen('pass succeeds as overruled', async () => {
          await invokeRouteSkill({
            skill: 'route.stone.set',
            args: { stone: '1.feature', route: '.', as: 'forced' },
            cwd: scene.tempDir,
          });
          return invokeRouteSkill({
            skill: 'route.stone.set',
            args: { stone: '1.feature', route: '.', as: 'passed' },
            cwd: scene.tempDir,
          });
        });

        then('exit code is 0', () => {
          expect(result.code).toEqual(0);
        });

        then('stdout confirms passage as overruled', () => {
          expect(result.stdout).toContain('passage = overruled');
        });

        then('snapshot matches', () => {
          expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
        });
      });
    },
  );
});
