import * as fs from 'fs/promises';
import * as path from 'path';
import { given, then, useBeforeAll, useThen, when } from 'test-fns';

import { answerEveryPeerGiven } from './.test/answerEveryPeerGiven';
import { getAllPourAnnounceLines } from './.test/getAllPourAnnounceLines';
import {
  execAsync,
  genTempDirForRhachet,
  invokeRouteSkill,
  sanitizeTimeForSnapshot,
} from './.test/invokeRouteSkill';

const ASSETS_DIR = path.join(
  __dirname,
  '.test/assets/route-peer-budget-multimember-l1',
);

/**
 * .mock = reviewer subprocess (mock-review-alpha.sh, mock-review-beta.sh, mock-review-final.sh)
 * .why = real reviewers cost LLM tokens; these mocks produce deterministic verdicts
 *        to prove the level gate and budget mechanics
 * .real = the full acceptance suite at `--scope peer-budget` exercises real
 *         reviewer subprocesses via `rhx review`
 */

/**
 * .what = acceptance test for the LEVEL GATE across a two-member l1
 * .why = proves L2 waits for ALL L1 reviewers to be terminal
 *
 * levels:
 *   - l1: alpha-checker, beta-checker (two members at ONE level)
 *   - l2: final-checker (awaits ALL l1 reviewers)
 *
 * ⚠️ .note = this file was `…peer-budget-parallel-l1` until i002/r1. there,
 *            `parallel` meant "two reviewers sit at one level" — never "they
 *            execute concurrently" — and `route.guard.concurrency` now records
 *            it as a forbidden synonym, so one word carried two senses in one
 *            repo. `multimember` names the subject outright: the gate, not the
 *            pour.
 *
 *            the two members DO now run concurrently, and this suite asserts
 *            naught about that — its snapshot oracle is what proves the settled
 *            tree is unchanged by the pour, which is a different guarantee.
 *
 *            ⇒ for the concurrency clamps themselves, read
 *              `driver.route.peer-concurrency.acceptance.test.ts` (peak count,
 *              non-overlap under a bound, declared-order release) and
 *              `driver.route.peer-concurrency-refusals.acceptance.test.ts`.
 *
 * 🔴 .why each phase pins the POUR ANNOUNCE as well as stdout = the announce is a
 *    deterministic stderr contract a driver reads, and its byte string varies with the
 *    member COUNT — `🦉 l1 pours 2 lanes` plus a two-branch roster is a distinct string
 *    from every 1-wide, 4-wide, and 12-wide announce already pinned elsewhere, so no
 *    other suite's oracle can substitute for this one. this is the only committed
 *    2-wide announce in the corpus.
 *
 *    ⚠️ and the gap it closes is the exact class of the i011/r9 misreport: the announce
 *    is composed from the DECLARED roster, so a drift in the roster shape, the plural
 *    noun, or the bound clause changes bytes a human reads and moves no stdout snapshot
 *    at all. raised i023/r002 blocker.1
 */
describe('driver.route.peer-budget-multimember-l1.acceptance', () => {
  given('[journey] a two-member L1: L2 awaits ALL L1s', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDirForRhachet({
        slug: 'peer-budget-multimember-l1',
        clone: ASSETS_DIR,
      });

      await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });
      await execAsync('chmod +x .test/mock-review-alpha.sh', { cwd: tempDir });
      await execAsync('chmod +x .test/mock-review-beta.sh', { cwd: tempDir });
      await execAsync('chmod +x .test/mock-review-final.sh', { cwd: tempDir });

      return { tempDir };
    });

    // =========================================================================
    // PHASE 1: both L1 reviewers run, L2 awaits
    // =========================================================================

    when('[t0] artifact created, both L1s run, L2 awaits', () => {
      const result = useThen('both L1 reviewers run', async () => {
        await fs.mkdir(path.join(scene.tempDir, 'src'), { recursive: true });
        await fs.writeFile(
          path.join(scene.tempDir, 'src', 'feature.ts'),
          'export const feature = () => "v1";',
        );

        // answer whatever the prior round left owed, before this one is entered.
        // a no-op on the first arrival; on every later one it is what the entrance
        // gate now requires — an edit alone no longer buys re-entry
        await answerEveryPeerGiven({ cwd: scene.tempDir, stone: '1.vision' });

        return invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1.vision', route: '.', as: 'passed' },
          cwd: scene.tempDir,
        });
      });

      then('exit code is non-zero (blocked)', () => {
        expect(result.code).not.toEqual(0);
      });

      then('alpha-checker (L1) ran', () => {
        expect(result.stdout).toContain('alpha-checker');
        expect(result.stdout).toContain('l1');
      });

      then('beta-checker (L1) ran', () => {
        expect(result.stdout).toContain('beta-checker');
      });

      then('final-checker (L2) awaits L1', () => {
        expect(result.stdout).toMatch(/final-checker.*awaits/s);
      });

      // 🔴 the 2-WIDE announce — see the docblock for why each count needs its own
      then('the pour announce has good vibes', () => {
        expect(getAllPourAnnounceLines(result.stderr)).toMatchSnapshot();
      });

      then('stdout has good vibes', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });

    // =========================================================================
    // PHASE 2: only alpha passes, beta still fails, L2 STILL awaits
    // =========================================================================

    when('[t1] alpha passes but beta fails, L2 STILL awaits', () => {
      const result = useThen('L2 still awaits (beta not terminal)', async () => {
        // make ONLY alpha-checker pass
        await fs.writeFile(
          path.join(scene.tempDir, '.test', 'alpha-should-pass'),
          '',
        );

        // change artifact to trigger re-review
        await fs.writeFile(
          path.join(scene.tempDir, 'src', 'feature.ts'),
          'export const feature = () => "v2";',
        );

        // answer whatever the prior round left owed, before this one is entered.
        // a no-op on the first arrival; on every later one it is what the entrance
        // gate now requires — an edit alone no longer buys re-entry
        await answerEveryPeerGiven({ cwd: scene.tempDir, stone: '1.vision' });

        return invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1.vision', route: '.', as: 'passed' },
          cwd: scene.tempDir,
        });
      });

      then('exit code is non-zero (blocked)', () => {
        expect(result.code).not.toEqual(0);
      });

      then('alpha-checker (L1) approved', () => {
        expect(result.stdout).toMatch(/alpha-checker.*approved/s);
      });

      then('beta-checker (L1) rejected (still has blockers)', () => {
        expect(result.stdout).toMatch(/beta-checker.*rejected/s);
      });

      then('final-checker (L2) STILL awaits (not all L1s terminal)', () => {
        // this is the key assertion: L2 should still await because beta is rejected, not terminal
        expect(result.stdout).toMatch(/final-checker.*awaits/s);
      });

      // 🔴 the 2-WIDE announce — see the docblock for why each count needs its own
      then('the pour announce has good vibes', () => {
        expect(getAllPourAnnounceLines(result.stderr)).toMatchSnapshot();
      });

      then('stdout has good vibes', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });

    // =========================================================================
    // PHASE 3: both L1s pass, L2 finally unlocks
    // =========================================================================

    when('[t2] both L1s pass, L2 unlocks', () => {
      const result = useThen('L2 runs after both L1s approve', async () => {
        // make beta-checker pass too
        await fs.writeFile(
          path.join(scene.tempDir, '.test', 'beta-should-pass'),
          '',
        );

        // change artifact to trigger re-review
        await fs.writeFile(
          path.join(scene.tempDir, 'src', 'feature.ts'),
          'export const feature = () => "v3";',
        );

        // answer whatever the prior round left owed, before this one is entered.
        // a no-op on the first arrival; on every later one it is what the entrance
        // gate now requires — an edit alone no longer buys re-entry
        await answerEveryPeerGiven({ cwd: scene.tempDir, stone: '1.vision' });

        return invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1.vision', route: '.', as: 'passed' },
          cwd: scene.tempDir,
        });
      });

      then('exit code is non-zero (blocked by L2)', () => {
        expect(result.code).not.toEqual(0);
      });

      then('alpha-checker (L1) approved', () => {
        expect(result.stdout).toMatch(/alpha-checker.*approved/s);
      });

      then('beta-checker (L1) approved', () => {
        expect(result.stdout).toMatch(/beta-checker.*approved/s);
      });

      then('final-checker (L2) ran (no longer awaits)', () => {
        expect(result.stdout).toContain('final-checker');
        expect(result.stdout).not.toMatch(/final-checker.*awaits/s);
      });

      // 🔴 the 2-WIDE announce — see the docblock for why each count needs its own
      then('the pour announce has good vibes', () => {
        expect(getAllPourAnnounceLines(result.stderr)).toMatchSnapshot();
      });

      then('stdout has good vibes', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });

    // =========================================================================
    // PHASE 4: L2 passes, stone passes
    // =========================================================================

    when('[t3] L2 passes, stone passes', () => {
      const result = useThen('all levels pass', async () => {
        // make final-checker pass
        await fs.writeFile(
          path.join(scene.tempDir, '.test', 'final-should-pass'),
          '',
        );

        // change artifact to trigger re-review
        await fs.writeFile(
          path.join(scene.tempDir, 'src', 'feature.ts'),
          'export const feature = () => "v4-final";',
        );

        // answer whatever the prior round left owed, before this one is entered.
        // a no-op on the first arrival; on every later one it is what the entrance
        // gate now requires — an edit alone no longer buys re-entry
        await answerEveryPeerGiven({ cwd: scene.tempDir, stone: '1.vision' });

        return invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1.vision', route: '.', as: 'passed' },
          cwd: scene.tempDir,
        });
      });

      then('exit code is 0', () => {
        expect(result.code).toEqual(0);
      });

      then('passage allowed', () => {
        expect(result.stdout).toContain('passage = allowed');
      });

      then('all reviewers approved', () => {
        expect(result.stdout).toMatch(/alpha-checker.*approved/s);
        expect(result.stdout).toMatch(/beta-checker.*approved/s);
        expect(result.stdout).toMatch(/final-checker.*approved/s);
      });

      // 🔴 the 2-WIDE announce — see the docblock for why each count needs its own
      then('the pour announce has good vibes', () => {
        expect(getAllPourAnnounceLines(result.stderr)).toMatchSnapshot();
      });

      then('stdout has good vibes', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });
  });
});
