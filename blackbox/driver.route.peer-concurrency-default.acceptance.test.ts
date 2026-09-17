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
import {
  clearReviewWindows,
  computeMaxInFlight,
  readReviewWindows,
} from './.test/readReviewWindows';

const ASSETS_DIR = path.join(
  __dirname,
  '.test/assets/route-peer-concurrency-default',
);

/**
 * .mock = reviewer subprocess (mock-window.sh)
 * .why = real reviewers cost LLM tokens; these mocks emit wall-clock overlap
 *        windows that `readReviewWindows` measures to prove concurrency clamps
 * .real = the full acceptance suite at `--scope peer-budget` exercises real
 *         reviewer subprocesses via `rhx review`; this suite's concern is the
 *         concurrency primitive, not the reviewer contract
 */

/**
 * .what = the level default, `DEFAULT_LEVEL_CONCURRENCY`, asserted against a level
 *         WIDER than it
 * .why = the wisher retracted their own "l1 is infinite" mid-round — *"ets expect
 *        that even l1 may have a bottleneck of 10 in parallel"* — so `10` is the
 *        floor every level inherits when no group binds it. it is the highest
 *        blast-radius claim in this change: it governs every extant guard in the
 *        org, none of which declares a group.
 *
 * 🔴 .note = and it was the ONE claim in the feature with no witness. every other
 *            concurrency fixture holds a level of FOUR, where a bound of ten and
 *            no bound at all pour identically — the vision says so itself:
 *            *"`10` and `unbounded` are indistinguishable at every level of ten
 *            or fewer."* so the l1 fan-out clamp sits NEXT to the default's claim
 *            and does not test it. an ADJACENT CLAMP, the same class this round
 *            caught twice before.
 *
 *            ⇒ twelve is the smallest level that parts the two, which is why this
 *              fixture exists rather than an assertion bolted onto the four-wide one.
 *
 * .note = one `given`, one arrival. this suite buys exactly one property, and a
 *         second pass would buy naught while it spent 2.5s twelve more times.
 */
describe('driver.route.peer-concurrency-default.acceptance', () => {
  given('[journey] a level of twelve, and no group to bind them', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDirForRhachet({
        slug: 'peer-concurrency-default',
        clone: ASSETS_DIR,
      });

      await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });
      await execAsync('chmod +x .test/mock-window.sh', { cwd: tempDir });

      return { tempDir };
    });

    when('[t0] the stone arrives and every reviewer rejects', () => {
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
          // 🔴 .why = hermetic unset of the operator override. this suite is the
          //           ONLY witness for DEFAULT_LEVEL_CONCURRENCY, so it must prove
          //           the DEFAULT — not whatever RHACHET_LEVEL_CONCURRENCY happened
          //           to leak in from the parent env. an inherited override of, say,
          //           2 passes both clamps (2 ≤ 10 and 2 > 1) while the default is
          //           never exercised: a clamp green for the wrong reason
          //           (rule.forbid.failhide). the `-env` suite passes an explicit
          //           value; this is its mirror, so the two range over two distinct
          //           values. `undefined` DELETES the key (see invokeRouteSkill).
          env: { RHACHET_LEVEL_CONCURRENCY: undefined },
        });
      });

      const observed = useThen('the windows are read', async () => {
        const windows = await readReviewWindows({ cwd: scene.tempDir });
        return {
          count: windows.length,
          peak: computeMaxInFlight({ windows }),
        };
      });

      then('every one of the twelve ran', () => {
        // .why = the bound governs how many run AT ONCE, never how many run. a
        //        clamp on the peak alone would green if the bound silently
        //        dropped lanes rather than held them in a queue
        expect(observed.count).toEqual(12);
      });

      then('CLAMP: the level default caps the pour at ten', () => {
        // 🔴 .why = the teeth. under an absent or raised default the twelve lanes
        //           all overlap and the peak reads 12, because each is held 2.5s
        //           while twelve subprocesses spawn in well under that.
        //
        // ✅ .proven = `DEFAULT_LEVEL_CONCURRENCY` set to `Infinity` — this line
        //             alone went red at `Expected: <= 10 / Received: 12`, while the
        //             other four stayed green. restored → 5/5. so the clamp bites
        //             THIS bound and no neighbour's.
        //
        // .note = `toBeLessThanOrEqual` rather than `toEqual(10)`. the bound is an
        //         UPPER limit, and a host slow enough to retire a lane before the
        //         tenth begins would make an equality assertion flake — while the
        //         upper limit stays true and still bites the defect arm.
        expect(observed.peak).toBeLessThanOrEqual(10);
      });

      then('CLAMP: the level still fans out — the cap is not a serial walk', () => {
        // .why = the limit above is satisfied by a peak of 1, so it cannot tell
        //        "bounded at ten" from "not concurrent at all". this is the other
        //        half, and the pair is only meaningful together
        expect(observed.peak).toBeGreaterThan(1);
      });

      then('the pour announce reads as declared', () => {
        // .why = `toContain` proves the text is PRESENT; it cannot prove the
        //        full line is well-formed or that no extra clause crept in.
        //        the announce is deterministic (level, count, and roster are
        //        fixed by the fixture), so a snapshot is the right oracle.
        //
        //        this also closes the gap the nitpick raised: the peer-concurrency
        //        suite pins the 4-lane announce, and this pins the 12-lane one —
        //        each is a distinct byte string (level count + roster differ),
        //        so one cannot substitute for the other
        const lines = getAllPourAnnounceLines(result.stderr);
        expect(lines).toMatchSnapshot();
      });

      then('stdout has good vibes', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });
  });
});
