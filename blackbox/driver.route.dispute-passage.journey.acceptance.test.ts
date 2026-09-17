import * as fs from 'fs/promises';
import * as path from 'path';
import { given, then, useBeforeAll, useThen, when } from 'test-fns';

import {
  getRouteGuardReviewPeerPathTaken,
  isRouteGuardReviewPeerGivenPath,
} from '../src/domain.operations/route/guard/review/peer/getRouteGuardReviewPeerPathTaken';
import {
  execAsync,
  genTempDirForRhachet,
  invokeRouteSkill,
  sanitizeTimeForSnapshot,
} from './.test/invokeRouteSkill';

const ASSETS_DIR = path.join(__dirname, '.test/assets/route-dispute-passage');
const FULCRUM_REL =
  '.fulcrums/inventory.of=fulcrums.case=F001-the-shape-is-deliberate.md';

/**
 * .what = the DRIVEN dispute journey, end to end through the REAL `reviewed?` judge:
 *         a lane rejects → the driver answers → disputes the one concern → absorbs the
 *         feedback → the judge sheds the disputed concern from its tally → the stone PASSES
 *
 * .why = r10 blocker.2 read this composition as unproven at every grain. the pieces were
 *        each tested alone — the write op, the tally-exclusion arithmetic, the ack render —
 *        and the one claim the whole behavior rests on was not: that a dispute actually
 *        moves a stone a reviewer refuses to release. a suite of proven parts does not prove
 *        the composition (`rule.require.acceptance-journey-coverage`).
 *
 * .note = this is the ONE journey here that needs no brain credential. the lane is a mock
 *         shell reviewer and the judge is the real `rhx route.stone.judge`, so the
 *         arithmetic under test is production code on every machine.
 *
 * 🔴 the lane raises its blocker on EVERY run, by construction — so a code fix cannot make
 *    this stone pass. if it passes, the dispute is the only reason it did.
 */
describe('driver.route.dispute-passage.journey.acceptance', () => {
  const scene = useBeforeAll(async () => {
    const tempDir = genTempDirForRhachet({
      slug: 'dispute-passage',
      clone: ASSETS_DIR,
    });
    await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });
    await execAsync('git checkout -b vlad/test-dispute-passage', {
      cwd: tempDir,
    });
    return { tempDir };
  });

  given('[case1] a lane that rejects and cannot be satisfied by a fix', () => {
    when('[t0] the driver arrives for the first round', () => {
      const result = useThen('the round runs', async () =>
        invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1.vision', route: '.', as: 'passed' },
          cwd: scene.tempDir,
        }),
      );

      then('the stone is HELD — one blocker against a zero allowance', () => {
        expect(result.code).not.toEqual(0);
      });

      then('the lane wrote a given', async () => {
        const entries = await fs.readdir(
          path.join(scene.tempDir, '.reviews', 'peer'),
        );
        const givens = entries.filter((name) =>
          isRouteGuardReviewPeerGivenPath({ pathGiven: name }),
        );
        expect(givens).toHaveLength(1);
      });

      then('the held-round emit is pinned', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot(
          'first round holds — the lane blocks with no stance yet declared',
        );
      });
    });

    when('[t1] the driver answers, then DISPUTES the one concern', () => {
      const result = useThen('the dispute is accepted', async () => {
        const peerDir = path.join(scene.tempDir, '.reviews', 'peer');
        const entries = await fs.readdir(peerDir);
        const nameGiven = entries.find((name) =>
          isRouteGuardReviewPeerGivenPath({ pathGiven: name }),
        )!;
        await fs.writeFile(
          path.join(
            peerDir,
            getRouteGuardReviewPeerPathTaken({ pathGiven: nameGiven }),
          ),
          '[REFUTE] the shape is deliberate — see the fulcrum\n',
        );

        return invokeRouteSkill({
          skill: 'route.stone.set',
          args: {
            stone: '1.vision',
            route: '.',
            as: 'disputed',
            with: 'lane',
            about: 'blocker.1',
            why: FULCRUM_REL,
          },
          cwd: scene.tempDir,
        });
      });

      then('the dispute is recorded', () => {
        expect(result.code).toEqual(0);
      });

      then('the ack names the fulcrum, and clears the road', () => {
        expect(result.stdout).toContain(FULCRUM_REL);
        expect(result.stdout).toContain('the council will read it');
        // the lane's only concern is now absorbed, so the close is a true all-clear
        expect(result.stdout).toContain('drive on');
      });

      then('the dispute ack is pinned', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot(
          'the dispute ack names the fulcrum and clears the road',
        );
      });
    });

    when('[t2] the driver absorbs the feedback', () => {
      const result = useThen('the composition gate opens', async () =>
        invokeRouteSkill({
          skill: 'route.stone.set',
          args: {
            stone: '1.vision',
            route: '.',
            as: 'absorbed',
            that: 'lane',
          },
          cwd: scene.tempDir,
        }),
      );

      then('it is accepted — every concern within the given is absorbed', () => {
        expect(result.code).toEqual(0);
      });

      then('the absorbed ack is pinned', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot(
          'the feedback absorption ack',
        );
      });
    });

    when('[t3] the driver drives on', () => {
      const result = useThen('the judge runs', async () =>
        invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1.vision', route: '.', as: 'passed' },
          cwd: scene.tempDir,
        }),
      );

      then('🔴 the stone PASSES — the dispute shed the blocker', () => {
        // the lane still raises its blocker every run. the ONLY reason the residual
        // clears is the tally exclusion, so this assertion IS the composition
        expect(result.code).toEqual(0);
      });

      then('the passage is on the ledger', async () => {
        const content = await fs.readFile(
          path.join(scene.tempDir, '.route', 'passage.jsonl'),
          'utf-8',
        );
        const rows = content
          .trim()
          .split('\n')
          .map((line) => JSON.parse(line) as Record<string, unknown>);
        expect(rows[rows.length - 1]!.status).toEqual('passed');
      });

      then('the emit a driver reads is pinned', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot(
          'dispute clears the tally, stone passes',
        );
      });
    });
  });
});
