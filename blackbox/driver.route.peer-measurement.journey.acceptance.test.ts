import * as fs from 'fs/promises';
import * as path from 'path';

import { given, then, useBeforeAll, useThen, useWhen, when } from 'test-fns';

import {
  execAsync,
  genTempDirForRhachet,
  invokeRouteSkill,
  sanitizeTimeForSnapshot,
} from './.test/invokeRouteSkill';

const ASSETS_DIR = path.join(__dirname, '.test/assets/route-peer-measurement');

/**
 * .what = journey acceptance test for the peer-measurement cascade, end-to-end through the CLI
 * .why = proves the changed guard measurement is sound across time: a fresh run reads a
 *        reviewer's counts and passes the stone; a cache re-run recovers the SAME resolved
 *        tally from the persisted `tallied` footer (no re-run, no drift) and renders identically.
 *        this is the ONLY test that exercises the cache re-run end-to-end — the one path where a
 *        lost `tactic` would silently regress the marker (howto.journey-tests-reveal-cache-bugs).
 *
 * .note = this journey uses a DETERMINISTIC (numeric) reviewer, per repo convention that
 *         acceptance journeys are deterministic (no real-brain non-determinism — see
 *         reflect.journey.acceptance.test.ts). the PROBABILISTIC tactic + its `tallied by
 *         reviewer@$brain` marker are exhaustively covered at the integration level
 *         (getReviewCountsViaBrain.caseBrain.deepseek-v4-flash.integration.test.ts,
 *         getReviewCounts.integration.test.ts — real brain, when.repeatably) and the marker's
 *         pass-path render is locked in formatRouteStoneEmit.test.ts. a deterministic reviewer
 *         correctly shows NO marker; the cache re-run proves that recovery stays deterministic.
 */
describe('driver.route.peer-measurement.journey.acceptance', () => {
  given('[journey] a stone reviewed by a deterministic peer reviewer', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDirForRhachet({
        slug: 'peer-measurement-journey',
        clone: ASSETS_DIR,
      });

      // link the driver role
      await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });

      // make the mock reviewer executable
      await execAsync('chmod +x .test/mock-review-numeric.sh', { cwd: tempDir });

      return { tempDir };
    });

    // [t0] preconditions — the artifact the reviewer will review
    when('[t0] the artifact is written', () => {
      const result = useThen('artifact is created', async () => {
        await fs.writeFile(
          path.join(scene.tempDir, '1.execute.md'),
          '# execute\n\nthis is the artifact under review.',
        );
        return { created: true };
      });

      then('the artifact exists', () => {
        expect(result.created).toBe(true);
      });
    });

    // [t1] fresh run — reviewer runs, counts read verbatim, stone passes
    const firstRun = useWhen('[t1] the stone is passed (fresh run)', () => {
      const result = useThen('the guard runs the reviewer', async () =>
        invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1.execute', route: '.', as: 'passed' },
          cwd: scene.tempDir,
        }),
      );

      then('exit code is 0 (review passed)', () => {
        expect(result.code).toEqual(0);
      });

      then('stdout confirms passage', () => {
        expect(result.stdout).toContain('passage = allowed');
      });

      then('the deterministic reviewer shows NO tallied-by marker', () => {
        expect(result.stdout).not.toContain('tallied by reviewer@');
      });

      then('stdout matches snapshot', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });

      return result;
    });

    // [t2] cache re-run — the persisted footer recovers the tally; render is identical
    when('[t2] the stone is passed again (cache re-run)', () => {
      const result = useThen('the guard reuses the cached review', async () =>
        invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1.execute', route: '.', as: 'passed' },
          cwd: scene.tempDir,
        }),
      );

      then('exit code is still 0', () => {
        expect(result.code).toEqual(0);
      });

      then('the reviewer shows cached (not re-run)', () => {
        expect(result.stdout).toContain('cached');
      });

      then('the marker is still absent (deterministic tactic recovered)', () => {
        expect(result.stdout).not.toContain('tallied by reviewer@');
      });

      then('the cache-run stdout matches the fresh-run stdout (modulo time)', () => {
        // the ONLY difference should be duration/cached markers, which the sanitizer folds.
        // if the union-narrowed re-parsers dropped the tally on cache-read, this would diverge.
        const firstReviewLines = sanitizeTimeForSnapshot(firstRun.stdout)
          .split('\n')
          .filter((l) => l.includes('blocker') || l.includes('nitpick'));
        const cacheReviewLines = sanitizeTimeForSnapshot(result.stdout)
          .split('\n')
          .filter((l) => l.includes('blocker') || l.includes('nitpick'));
        expect(cacheReviewLines).toEqual(firstReviewLines);
      });

      then('cache-run stdout matches snapshot', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });

    // [tN] final state — the persisted review artifact carries the resolved tally footer
    when('[tN] the persisted review artifact is inspected', () => {
      const result = useThen('read the persisted review file', async () => {
        const reviewsDir = path.join(scene.tempDir, '.reviews', 'peer');
        const files = await fs.readdir(reviewsDir);
        const stdoutFiles = files.filter(
          (f) =>
            f.includes('numeric-reviewer') &&
            f.endsWith('.md') &&
            !f.includes('.report.md'),
        );
        const content = await fs.readFile(
          path.join(reviewsDir, stdoutFiles[0]!),
          'utf-8',
        );
        return { content, count: stdoutFiles.length };
      });

      then('exactly one persisted review artifact exists', () => {
        expect(result.count).toBe(1);
      });

      then('the persisted artifact carries the reviewer counts', () => {
        // the resolved tally is durable in the artifact — what makes the cache re-read correct.
        expect(result.content).toContain('0 blockers');
        expect(result.content).toContain('2 nitpicks');
      });

      then('the persisted artifact content matches snapshot', () => {
        // snapshot the final journey step so a reviewer can reconstruct the whole journey from
        // snapshots alone (rule.require.snapshot-every-journey-step). time is folded so the
        // durable tally footer — not run-to-run duration — is what the snapshot locks.
        expect(sanitizeTimeForSnapshot(result.content)).toMatchSnapshot();
      });
    });
  });

  // the crash path, through the real CLI — blackbox usecase.4. a reviewer that exits non-zero
  // is a real failure, never rescued by the sub-brain (the exit-0 gate skips the fallback), so
  // the stone blocks as a malfunction with NO `tallied by` marker. this is the deterministic
  // half of the blueprint's journey design (its [t4] crash timestep) proven end-to-end, so a
  // human sees the real blocked stdout, not just an isolated integration assertion.
  given('[journey] a stone reviewed by a reviewer that crashes (non-zero exit)', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDirForRhachet({
        slug: 'peer-measurement-journey-crash',
        clone: ASSETS_DIR,
      });

      await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });
      await execAsync('chmod +x .test/mock-review-crash.sh', { cwd: tempDir });

      return { tempDir };
    });

    // [t0] preconditions — the artifact the reviewer will review
    when('[t0] the artifact is written', () => {
      const result = useThen('artifact is created', async () => {
        await fs.writeFile(
          path.join(scene.tempDir, '2.crash.md'),
          '# crash\n\nthis is the artifact under review.',
        );
        return { created: true };
      });

      then('the artifact exists', () => {
        expect(result.created).toBe(true);
      });
    });

    // [t1] the crashed reviewer blocks the stone as a malfunction, never rescued
    when('[t1] the stone is passed (crashed reviewer)', () => {
      const result = useThen('the guard runs the crashed reviewer', async () =>
        invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '2.crash', route: '.', as: 'passed' },
          cwd: scene.tempDir,
        }),
      );

      then('exit code is non-zero (stone blocked)', () => {
        expect(result.code).not.toEqual(0);
      });

      then('stdout reports a malfunction, not a passage', () => {
        expect(result.stdout).toContain('malfunction');
        expect(result.stdout).not.toContain('passage = allowed');
      });

      then('the crashed reviewer shows NO tallied-by marker (never rescued)', () => {
        expect(result.stdout).not.toContain('tallied by reviewer@');
      });

      then('crash-path stdout matches snapshot', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });
  });
});
