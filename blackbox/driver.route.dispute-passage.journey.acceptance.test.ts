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
        expect(result.code).toEqual(2);
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

      // invariant 6: a dispute is settled by a human or a reflection, never by another paid read
      then('🔴 the dispute triggers no re-run — the lane still holds one given', async () => {
        const entries = await fs.readdir(
          path.join(scene.tempDir, '.reviews', 'peer'),
        );
        const givens = entries.filter((name) =>
          isRouteGuardReviewPeerGivenPath({ pathGiven: name }),
        );
        expect(givens).toHaveLength(1);
      });

      then('the ack names the fulcrum, and the absorb that comes next', () => {
        expect(result.stdout).toContain(FULCRUM_REL);
        expect(result.stdout).toContain('the council will read it');
        // the lane's last concern now has a stance, so the next move is to absorb the lane
        // (the .taken gate opens) and re-arrive — never a bare `--as passed`, which would
        // send the driver past the absorb that [t2] performs
        expect(result.stdout).toContain(
          'rhx route.stone.set --stone 1.vision --as absorbed --that lane',
        );
        expect(result.stdout).toContain(
          'rhx route.stone.set --stone 1.vision --as arrived',
        );
        expect(result.stdout).not.toContain('--as passed');
      });

      then('the dispute ack is pinned', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot(
          'the dispute ack names the fulcrum and the absorb that comes next',
        );
      });
    });

    // the third surface of the one render: the `approved?` judge a human gate runs. it must name
    // the same dispute and the same verdict command the halt and the approval refusal do
    when('[t1b] the `approved?` judge runs while the dispute is open', () => {
      const result = useThen('the judge reports', async () =>
        invokeRouteSkill({
          skill: 'route.stone.judge',
          args: { mechanism: 'approved?', stone: '1.vision', route: '.' },
          cwd: scene.tempDir,
        }),
      );

      then('🔴 the judge names the dispute and its verdict command', () => {
        expect(result.stdout).toContain('passed: false');
        expect(result.stdout).toContain('1 dispute owes your verdict');
        expect(result.stdout).toContain(
          'rhx route.fulcrum.rule --case F001 --as upheld|conceded',
        );
      });

      then('the judge output a human reads is pinned', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot(
          'the approved judge names the open dispute',
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

    // invariant 1 lets the dispute ride past 1.vision; this route has no `approved?` judge
    // anywhere, so its LAST stone is the one place the open dispute must surface (fulcrum F5).
    // 2.ship carries no guard, so this pins the no-guard passage branch of `setStoneAsPassed`.
    // the leaf asserts are pinned whole at integration grain; the two judged branches share the
    // one `assertPassageDisputesRuled` closure this branch calls
    when('[t4] the driver tries to pass the last stone, the dispute still open', () => {
      const result = useThen('the last stone is refused', async () => {
        await fs.writeFile(
          path.join(scene.tempDir, '2.ship.yield.md'),
          'shipped.\n',
        );
        return invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '2.ship', route: '.', as: 'passed' },
          cwd: scene.tempDir,
        });
      });

      then('🔴 the last stone is refused — a gateless route cannot finish past a dispute', () => {
        expect(result.code).toEqual(2);
      });

      then('the refusal names the dispute and the verdict command', () => {
        const output = result.stdout + result.stderr;
        expect(output).toContain('the last stone has no human gate');
        expect(output).toContain('F001');
        expect(output).toContain(
          'rhx route.fulcrum.rule --case F001 --as upheld|conceded',
        );
      });

      then('the refusal a driver reads is pinned', () => {
        expect(
          sanitizeTimeForSnapshot(`${result.stdout}\n---\n${result.stderr}`),
        ).toMatchSnapshot('the gateless last stone refuses past a dispute');
      });
    });
  });

  given('[case2] the same route, with no fulcrum on it', () => {
    when('[t0] the `approved?` judge runs', () => {
      const result = useThen('the judge reports', async () => {
        const tempDir = genTempDirForRhachet({
          slug: 'dispute-passage-clean',
          clone: ASSETS_DIR,
        });
        await fs.rm(path.join(tempDir, '.fulcrums'), {
          recursive: true,
          force: true,
        });
        await execAsync('npx rhachet roles link --role driver', {
          cwd: tempDir,
        });
        return invokeRouteSkill({
          skill: 'route.stone.judge',
          args: { mechanism: 'approved?', stone: '1.vision', route: '.' },
          cwd: tempDir,
        });
      });

      then('the judge asks only for the approval, with no dispute lines', () => {
        expect(result.stdout).toContain('passed: false');
        expect(result.stdout).not.toContain('dispute');
        expect(result.stdout).toContain('--as approved');
      });

      then('the judge output a human reads is pinned', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot(
          'the approved judge on a clean route',
        );
      });
    });
  });

  // the third surface of the one render, on a fault: the judge must name a corrupt ledger and its
  // fix as the drive halt does, never throw a bare constraint with no verdict
  given('[case2b] the same route, its verdict ledger corrupt', () => {
    when('[t0] the `approved?` judge runs', () => {
      const result = useThen('the judge reports', async () => {
        const tempDir = genTempDirForRhachet({
          slug: 'dispute-passage-ledger',
          clone: ASSETS_DIR,
        });
        await fs.writeFile(
          path.join(tempDir, '.fulcrums', 'verdicts.jsonl'),
          'not json\n',
        );
        await execAsync('npx rhachet roles link --role driver', {
          cwd: tempDir,
        });
        return invokeRouteSkill({
          skill: 'route.stone.judge',
          args: { mechanism: 'approved?', stone: '1.vision', route: '.' },
          cwd: tempDir,
        });
      });

      then('🔴 the judge renders a verdict that names the ledger and its repair', () => {
        expect(result.stdout).toContain('passed: false');
        expect(result.stdout).toContain(
          'the dispute record cannot be read; approval is refused until it is repaired',
        );
        expect(result.stdout).toContain('restore the line from git');
      });

      then('the judge output a human reads is pinned', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot(
          'the approved judge on a corrupt ledger',
        );
      });
    });
  });

  // invariant 2 at a human gate: an approval granted BEFORE a dispute was raised cannot carry the
  // stone past it. the `approved?` judge reads the dispute state on every run, never only at the
  // moment of approval, so a stale approval is no verdict on a dispute it never saw
  given('[case3] a human gate, approved before the driver disputes a concern', () => {
    const gated = useBeforeAll(async () => {
      const tempDir = genTempDirForRhachet({
        slug: 'dispute-passage-gated',
        clone: ASSETS_DIR,
      });
      const guard = await fs.readFile(
        path.join(tempDir, '1.vision.guard'),
        'utf-8',
      );
      await fs.writeFile(
        path.join(tempDir, '1.vision.guard'),
        `${guard}  - rhx route.stone.judge --mechanism approved? --stone $stone --route $route\n`,
      );
      await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });
      await execAsync('git checkout -b vlad/test-dispute-passage-gated', {
        cwd: tempDir,
      });
      return { tempDir };
    });

    when('[t0] the lane holds, the human approves, then the driver disputes and absorbs', () => {
      const setup = useThen('each step is accepted', async () => {
        const arrived = await invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1.vision', route: '.', as: 'passed' },
          cwd: gated.tempDir,
        });
        // the fulcrum is written only after the approval, so the human approved a stone with
        // no dispute on it
        const fulcrumPath = path.join(gated.tempDir, FULCRUM_REL);
        const fulcrum = await fs.readFile(fulcrumPath, 'utf-8');
        await fs.rm(fulcrumPath);
        const approved = await invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1.vision', route: '.', as: 'approved' },
          cwd: gated.tempDir,
        });
        await fs.writeFile(fulcrumPath, fulcrum);
        const peerDir = path.join(gated.tempDir, '.reviews', 'peer');
        const nameGiven = (await fs.readdir(peerDir)).find((name) =>
          isRouteGuardReviewPeerGivenPath({ pathGiven: name }),
        )!;
        await fs.writeFile(
          path.join(
            peerDir,
            getRouteGuardReviewPeerPathTaken({ pathGiven: nameGiven }),
          ),
          '[REFUTE] the shape is deliberate — see the fulcrum\n',
        );
        const disputed = await invokeRouteSkill({
          skill: 'route.stone.set',
          args: {
            stone: '1.vision',
            route: '.',
            as: 'disputed',
            with: 'lane',
            about: 'blocker.1',
            why: FULCRUM_REL,
          },
          cwd: gated.tempDir,
        });
        const absorbed = await invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1.vision', route: '.', as: 'absorbed', that: 'lane' },
          cwd: gated.tempDir,
        });
        return { arrived, approved, disputed, absorbed };
      });

      then('the lane held, and the approval, dispute, and absorb each landed', () => {
        expect(setup.arrived.code).toEqual(2);
        expect(setup.approved.code).toEqual(0);
        expect(setup.disputed.code).toEqual(0);
        expect(setup.absorbed.code).toEqual(0);
      });
    });

    when('[t1] the driver tries to pass the approved stone', () => {
      const result = useThen('the gate is refused', async () =>
        invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1.vision', route: '.', as: 'passed' },
          cwd: gated.tempDir,
        }),
      );

      then('🔴 the stone is HELD — the approval predates the dispute it would settle', () => {
        expect(result.code).toEqual(2);
      });

      then('both judges allow, so the passage dispute check is the one that refuses', () => {
        expect(result.stdout).toContain('judge.1 - allowed');
        expect(result.stdout).toContain('judge.2 - allowed');
        expect(result.stderr).toContain(
          "a dispute owes the human at this stone's gate",
        );
      });

      then('the refusal names the dispute and its verdict command', () => {
        const output = result.stdout + result.stderr;
        expect(output).toContain('F001');
        expect(output).toContain(
          'rhx route.fulcrum.rule --case F001 --as upheld|conceded',
        );
      });

      then('the refusal a driver reads is pinned', () => {
        expect(
          sanitizeTimeForSnapshot(`${result.stdout}\n---\n${result.stderr}`),
        ).toMatchSnapshot('an approval before the dispute cannot pass it');
      });
    });
  });
});
