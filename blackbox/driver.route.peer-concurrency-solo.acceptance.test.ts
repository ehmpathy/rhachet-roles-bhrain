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
import { clearReviewWindows, readReviewWindows } from './.test/readReviewWindows';

const ASSETS_DIR = path.join(
  __dirname,
  '.test/assets/route-peer-concurrency-solo',
);

/**
 * .mock = reviewer subprocess (mock-window.sh)
 * .why = real reviewers cost LLM tokens; these mocks emit wall-clock overlap
 *        windows that `readReviewWindows` measures to prove the lane ran
 * .real = the full acceptance suite at `--scope peer-budget` exercises real
 *         reviewer subprocesses via `rhx review`; this suite's concern is the
 *         announce wire, not the reviewer contract
 */

/**
 * .what = the ANNOUNCE wire clamp for a single-reviewer level
 * .why = the announce was built for exactly this case. `genContextCliEmit`
 *        seals no header at inflight for the slotted path
 *        (`wave.launch(…); drawStatus(); return`), and under a pipe
 *        `drawStatus` is a no-op. so without the announce a 1-member level is
 *        byte-silent from launch to settle. the unit test at
 *        `asReviewLevelPourAnnounce.[case4]` pins the byte string; it does not
 *        prove the wire. cut the `console.error(announce)` call in
 *        `runStoneGuardReviews` and every unit test stays green while a piped
 *        log goes silent for a solo level — so THIS assertion is the teeth of
 *        the wire repair
 *
 * .note = one `given`, one arrival. this suite buys exactly one property, and
 *         a second pass would buy naught while it spent another subprocess round.
 */
describe('driver.route.peer-concurrency-solo.acceptance', () => {
  given('[journey] a level of one, the silence-gap case', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDirForRhachet({
        slug: 'peer-concurrency-solo',
        clone: ASSETS_DIR,
      });

      await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });
      await execAsync('chmod +x .test/mock-window.sh', { cwd: tempDir });

      return { tempDir };
    });

    when('[t0] the stone arrives and the sole reviewer rejects', () => {
      const result = useThen('the stone blocks at l1', async () => {
        await fs.mkdir(path.join(scene.tempDir, 'src'), { recursive: true });
        await fs.writeFile(
          path.join(scene.tempDir, 'src', 'feature.ts'),
          'export const feature = () => "v1";',
        );

        await clearReviewWindows({ cwd: scene.tempDir });
        await answerEveryPeerGiven({ cwd: scene.tempDir, stone: '1.vision' });

        return invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1.vision', route: '.', as: 'passed' },
          cwd: scene.tempDir,
        });
      });

      const observed = useThen('the window is read', async () => {
        const windows = await readReviewWindows({ cwd: scene.tempDir });
        return { count: windows.length };
      });

      then('the sole reviewer ran', () => {
        // .why = the premise every clamp below rests on. a window that never
        //        came would mean the lane never ran — an absent announce is
        //        then a trivially true claim with no test to pass or fail
        expect(observed.count).toEqual(1);
      });

      then('CLAMP: 🔴 the WIRE — the announce appears on stderr', () => {
        // 🔴 .why = THE clamp this suite exists to provide. the unit test at
        //           `asReviewLevelPourAnnounce.[case4]` proves the byte string
        //           for a solo level; it does not prove the wire. cut the
        //           `console.error(announce)` call in `runStoneGuardReviews`
        //           and every unit test stays green — this is the ONLY assertion
        //           that would go red
        //
        // .why = the feature's docblock names this case: "a single-member level
        //        is byte-silent from launch to settle" — the silence this
        //        announce closes is the 1-member case. a multi-member level
        //        emits a settled block header; a solo level does not, so the
        //        announce is the ONLY byte that tells a reader "this level
        //        began". that is why the `< 2` boundary was not taken: a
        //        1-member level announces, and a 0-member level is null
        expect(result.stderr).toContain('🦉 l1 pours 1 lane');
        expect(result.stderr).toContain('r1:solo');
      });

      then('the pour announce reads as declared', () => {
        // .why = `toContain` proves the text is PRESENT; it cannot prove the
        //        full line is well-formed or that no extra clause crept in.
        //        the announce is deterministic — level, count, and roster are
        //        all fixed by the fixture — so a snapshot is the right oracle.
        //        this also closes the gap the reviewer named: the peer-concurrency
        //        suite pins the 4-lane announce, this pins the 1-lane one —
        //        each is a distinct byte string, so one cannot substitute for the other
        const lines = getAllPourAnnounceLines(result.stderr);
        expect(lines).toMatchSnapshot();
      });

      then('stdout has good vibes', () => {
        // .why = `rule.require.snapshot-every-journey-step` — every `[tn]`,
        //        never a subset. `[t0]` is the state: one l1 lane rejected,
        //        the guard blocked
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });
  });
});
