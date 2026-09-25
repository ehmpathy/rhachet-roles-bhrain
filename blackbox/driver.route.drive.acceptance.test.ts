import * as fs from 'fs/promises';
import * as path from 'path';
import { given, then, useBeforeAll, useThen, when } from 'test-fns';

import { getSelfReviewArticulationPath } from '../src/domain.operations/route/guard/review/self/getSelfReviewArticulationPath';
import { isPathFound } from '../src/domain.operations/route/isPathFound';
import { getRouteDirFiles } from './.test/getRouteDirFiles';
import {
  execAsync,
  genTempDirForRhachet,
  invokeRouteSkill,
  sanitizeTimeForSnapshot,
} from './.test/invokeRouteSkill';

const ASSETS_DIR = path.join(__dirname, '.test/assets/route-drive');

/**
 * .what = backdates triggered report mtime to bypass time enforcement
 * .why = tests need to verify promise flow without 90 second wait
 *
 * .note = backdates ALL matched .since files (there may be multiple with different hashes)
 */
const backdateTriggeredReport = async (input: {
  tempDir: string;
  stone: string;
  slug: string;
}): Promise<void> => {
  const routeDir = path.join(input.tempDir, '.route');
  // 🔴 the shared reader, never a bare `.catch(() => [])`. this read FEEDS A MUTATION,
  //    so a swallowed EACCES makes the back-date loop a no-op and every case downstream
  //    runs against the wrong precondition — a wrong verdict, not a fault
  const files = await getRouteDirFiles(routeDir);
  const triggeredFiles = files.filter(
    (f) =>
      f.includes(`${input.stone}.guard.selfreview.${input.slug}`) &&
      f.endsWith('.triggered.since'),
  );
  const mtimePast = new Date(Date.now() - 31 * 1000);
  for (const triggeredFile of triggeredFiles) {
    const filepath = path.join(routeDir, triggeredFile);
    await fs.utimes(filepath, mtimePast, mtimePast);
  }
};

/**
 * .what = reads the accumulated blocker count from the route's blocker state
 * .why = the count lives on disk, never in the emit — so a test that asserts the
 *        count advanced must read the state rather than diff two renders
 *
 * .note = any `--as` wipes this state (the driver declared their status), so the
 *         read is only meaningful BEFORE an `--as` lands
 */
const getBlockerCount = async (tempDir: string): Promise<number> => {
  const state = JSON.parse(
    await fs.readFile(
      path.join(tempDir, '.route', '.drive.blockers.latest.json'),
      'utf-8',
    ),
  );
  return state.count;
};

/**
 * .what = acceptance tests for route.drive skill
 * .why = verifies GPS-like guidance shows current stone and pass command
 */
describe('driver.route.drive.acceptance', () => {
  given('[case1] route bound with unpassed stones', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDirForRhachet({
        slug: 'drive-case1',
        clone: ASSETS_DIR,
      });

      // link the driver role
      await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });

      // create feature branch (bind rejects protected branches like main)
      await execAsync('git checkout -b vlad/test-drive-case1', { cwd: tempDir });

      // bind the route
      await invokeRouteSkill({
        skill: 'route.bind.set',
        args: { route: '.' },
        cwd: tempDir,
      });

      return { tempDir };
    });

    when('[t0] route.drive is invoked', () => {
      const result = useThen('route.drive succeeds', async () =>
        invokeRouteSkill({
          skill: 'route.drive',
          args: {},
          cwd: scene.tempDir,
        }),
      );

      then('exit code is 0', () => {
        expect(result.code).toEqual(0);
      });

      then('shows current stone name', () => {
        expect(result.stdout).toContain('stone = 1');
      });

      then('shows stone content', () => {
        expect(result.stdout).toContain('implement the feature');
      });

      then('shows pass command', () => {
        expect(result.stdout).toContain('route.stone.set');
        expect(result.stdout).toContain('--as passed');
      });

      then('stdout has good vibes', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });
  });

  given('[case2] route bound with all stones passed (hook mode)', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDirForRhachet({
        slug: 'drive-case2',
        clone: ASSETS_DIR,
      });

      // link the driver role
      await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });

      // create feature branch (bind rejects protected branches like main)
      await execAsync('git checkout -b vlad/test-drive-case2', { cwd: tempDir });

      // bind the route
      await invokeRouteSkill({
        skill: 'route.bind.set',
        args: { route: '.' },
        cwd: tempDir,
      });

      // create artifacts and pass all stones
      await fs.writeFile(
        path.join(tempDir, '1.stone.i1.md'),
        '# Implementation\n\nFeature implemented.',
      );
      await fs.writeFile(
        path.join(tempDir, '2.stone.i1.md'),
        '# Docs\n\nDocumentation written.',
      );

      // mark both stones as passed (via passage.jsonl)
      await fs.mkdir(path.join(tempDir, '.route'), { recursive: true });
      const passageContent =
        ['{"stone":"1","status":"passed"}', '{"stone":"2","status":"passed"}'].join('\n') + '\n';
      await fs.writeFile(path.join(tempDir, '.route', 'passage.jsonl'), passageContent);

      return { tempDir };
    });

    when('[t0] route.drive is invoked with --mode hook', () => {
      const result = useThen('route.drive exits silently', async () =>
        invokeRouteSkill({
          skill: 'route.drive',
          args: { when: 'hook.onBoot' },
          cwd: scene.tempDir,
        }),
      );

      then('exit code is 0', () => {
        expect(result.code).toEqual(0);
      });

      then('stdout is empty (silent)', () => {
        expect(result.stdout.trim()).toEqual('');
      });
    });
  });

  given('[case3] route bound with all stones passed (direct mode)', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDirForRhachet({
        slug: 'drive-case3',
        clone: ASSETS_DIR,
      });

      // link the driver role
      await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });

      // create feature branch (bind rejects protected branches like main)
      await execAsync('git checkout -b vlad/test-drive-case3', { cwd: tempDir });

      // bind the route
      await invokeRouteSkill({
        skill: 'route.bind.set',
        args: { route: '.' },
        cwd: tempDir,
      });

      // create artifacts and pass all stones
      await fs.writeFile(
        path.join(tempDir, '1.stone.i1.md'),
        '# Implementation\n\nFeature implemented.',
      );
      await fs.writeFile(
        path.join(tempDir, '2.stone.i1.md'),
        '# Docs\n\nDocumentation written.',
      );

      // mark both stones as passed (via passage.jsonl)
      await fs.mkdir(path.join(tempDir, '.route'), { recursive: true });
      const passageContent =
        ['{"stone":"1","status":"passed"}', '{"stone":"2","status":"passed"}'].join('\n') + '\n';
      await fs.writeFile(path.join(tempDir, '.route', 'passage.jsonl'), passageContent);

      return { tempDir };
    });

    when('[t0] route.drive is invoked without mode', () => {
      const result = useThen('route.drive shows completion', async () =>
        invokeRouteSkill({
          skill: 'route.drive',
          args: {},
          cwd: scene.tempDir,
        }),
      );

      then('exit code is 0', () => {
        expect(result.code).toEqual(0);
      });

      then('stdout shows route complete', () => {
        expect(result.stdout.toLowerCase()).toContain('complete');
      });

      then('stdout has good vibes', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });
  });

  given('[case4] hook mode blocks stop when stones remain', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDirForRhachet({
        slug: 'drive-case4',
        clone: ASSETS_DIR,
      });

      // link the driver role
      await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });

      // create feature branch
      await execAsync('git checkout -b vlad/test-drive-case4', { cwd: tempDir });

      // bind the route
      await invokeRouteSkill({
        skill: 'route.bind.set',
        args: { route: '.' },
        cwd: tempDir,
      });

      return { tempDir };
    });

    when('[t0] route.drive is invoked with --when hook.onStop', () => {
      const result = useThen('route.drive blocks', async () =>
        invokeRouteSkill({
          skill: 'route.drive',
          args: { when: 'hook.onStop' },
          cwd: scene.tempDir,
        }),
      );

      then('exit code is 2 (block)', () => {
        expect(result.code).toEqual(2);
      });

      then('stdout shows stone content', () => {
        expect(result.stdout).toContain('where were we?');
        expect(result.stdout).toContain('stone = 1');
      });

      then('stderr has same content as stdout (for visibility)', () => {
        expect(result.stderr).toContain('where were we?');
        expect(result.stderr).toContain('stone = 1');
      });

      then('stdout matches non-hook mode (same content)', () => {
        // hook mode should show same stone content as direct mode
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });

    when('[t1] route.drive invoked twice in hook mode', () => {
      const observed = useThen(
        'the second call runs, and the count behind it is read',
        async () => {
          // first call
          await invokeRouteSkill({
            skill: 'route.drive',
            args: { when: 'hook.onStop' },
            cwd: scene.tempDir,
          });
          const countAfterFirst = await getBlockerCount(scene.tempDir);
          // second call
          const result = await invokeRouteSkill({
            skill: 'route.drive',
            args: { when: 'hook.onStop' },
            cwd: scene.tempDir,
          });
          const countAfterSecond = await getBlockerCount(scene.tempDir);
          return { result, countAfterFirst, countAfterSecond };
        },
      );

      then('stderr has same content as stdout', () => {
        expect(observed.result.stderr).toContain('where were we?');
      });

      /**
       * 🔴 .why this assertion exists = the block is named "second call has higher count",
       *    and until i002 no assertion here read a count at all. the claim rested on a
       *    snapshot, and the snapshot cannot carry it — see below
       */
      then('the count behind the block really does advance', () => {
        expect(observed.countAfterSecond).toBeGreaterThan(
          observed.countAfterFirst,
        );
      });

      then('stderr has good vibes', () => {
        // 🔴 .why = the emit is IDENTICAL to [t0]'s, byte for byte, and that is the property
        //    this pin actually carries: the driver meets the same guidance on the retry, with
        //    no escalation leaked into the render. a regression that started to escalate the
        //    message — a count, a scold, a truncated hint — goes red here.
        //
        // ⚠️ .note = an earlier `.why` claimed this snapshot made "the escalation a driver
        //    meets on the retry" readable. it does not, and it never could: the count lives
        //    in `.route/.drive.blockers.latest.json`, never in the emit, so the two exports
        //    are byte-identical by design. the claim was corrected rather than the snapshot
        //    deleted — the pin is real, and it was the CLAIM that overreached. the count now
        //    has the assertion above, which reads the state the emit does not carry
        expect(sanitizeTimeForSnapshot(observed.result.stderr)).toMatchSnapshot();
      });
    });

    when('[t2] blocker state file exists', () => {
      /**
       * ⚠️ .note = NO snapshot here, and deliberately so. this step runs no command — it
       *            probes the state the two blocks above left on disk, so there is no user
       *            experience to pin. `rule.require.snapshot-every-journey-step` asks for a
       *            snapshot of every step that PRODUCES output; a state probe produces none.
       *            stated rather than implied, since an absent snapshot and an owed one read
       *            identically to a reviewer.
       */
      then('.route/.drive.blockers.latest.json exists', async () => {
        const statePath = path.join(
          scene.tempDir,
          '.route',
          '.drive.blockers.latest.json',
        );
        const exists = await isPathFound(statePath);
        expect(exists).toBe(true);
      });

      // note: .drive.blocker.events.jsonl was removed in bonus cleanup (dead code)
    });
  });

  given('[case5] passed stone clears blocker state', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDirForRhachet({
        slug: 'drive-case5',
        clone: ASSETS_DIR,
      });

      // link the driver role
      await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });

      // create feature branch
      await execAsync('git checkout -b vlad/test-drive-case5', { cwd: tempDir });

      // bind the route
      await invokeRouteSkill({
        skill: 'route.bind.set',
        args: { route: '.' },
        cwd: tempDir,
      });

      // trigger a few blocks
      await invokeRouteSkill({
        skill: 'route.drive',
        args: { when: 'hook.onStop' },
        cwd: tempDir,
      });
      await invokeRouteSkill({
        skill: 'route.drive',
        args: { when: 'hook.onStop' },
        cwd: tempDir,
      });

      // capture the blocker state now — AFTER the blocks, BEFORE any --as.
      // any --as wipes the state (the driver marked their status), so this is
      // the only point the accumulated count can be observed.
      const blockerCountBeforeAs = await getBlockerCount(tempDir);

      // create artifact for stone 1 so it can pass
      await fs.writeFile(
        path.join(tempDir, '1.stone.i1.md'),
        '# Implementation\n\nFeature done.',
      );

      // make mock-review.sh executable
      await execAsync('chmod +x .test/mock-review.sh', { cwd: tempDir });

      // trigger review.self via --as passed (creates triggered marker files)
      await invokeRouteSkill({
        skill: 'route.stone.set',
        args: { stone: '1', as: 'passed' },
        cwd: tempDir,
      });

      // backdate triggered reports to bypass time enforcement
      await backdateTriggeredReport({ tempDir, stone: '1', slug: 'all-done' });

      // create articulation file for first review.self (required by file presence check)
      const articulationPath1 = getSelfReviewArticulationPath({
        route: tempDir,
        stone: '1',
        slug: 'all-done',
      });
      await fs.mkdir(path.dirname(articulationPath1), { recursive: true });
      await fs.writeFile(articulationPath1, '# self-review\n\nall done.');

      // promise first review.self
      // .note = --into names the path the guard computes. the route is bound to '.',
      //         so that is the route segment the guard uses, never the temp dir
      await invokeRouteSkill({
        skill: 'route.stone.set',
        args: {
          stone: '1',
          as: 'promised',
          that: 'all-done',
          into: getSelfReviewArticulationPath({
            route: '.',
            stone: '1',
            slug: 'all-done',
          }),
        },
        cwd: tempDir,
      });

      // trigger second review.self and backdate
      await invokeRouteSkill({
        skill: 'route.stone.set',
        args: { stone: '1', as: 'passed' },
        cwd: tempDir,
      });
      await backdateTriggeredReport({ tempDir, stone: '1', slug: 'tests-pass' });

      // create articulation file for second review.self (required by file presence check)
      const articulationPath2 = getSelfReviewArticulationPath({
        route: tempDir,
        stone: '1',
        slug: 'tests-pass',
      });
      await fs.writeFile(articulationPath2, '# self-review\n\ntests pass.');

      // promise second review.self
      await invokeRouteSkill({
        skill: 'route.stone.set',
        args: {
          stone: '1',
          as: 'promised',
          that: 'tests-pass',
          into: getSelfReviewArticulationPath({
            route: '.',
            stone: '1',
            slug: 'tests-pass',
          }),
        },
        cwd: tempDir,
      });

      // create marker so mock review passes
      await fs.writeFile(
        path.join(tempDir, '.test', 'review-should-pass'),
        '',
      );

      return { tempDir, blockerCountBeforeAs };
    });

    /**
     * 🔴 .note = this case's three steps carried NO snapshot at all until i018, and it is the
     *            arc a reviewer most needs to read: blocked → passed → driven again. the only
     *            assertions were booleans and one `toContain`, so the guard-tree output a
     *            driver meets at `[t1]` and the RESET count at `[t2]` were both invisible in
     *            the diff (`repo-rules` blocker.1 at i018).
     */
    when('[t0] after the blocks, before any --as', () => {
      /**
       * ⚠️ .note = NO snapshot. this step runs no command — it reads a count captured in the
       *            scene before any `--as`, because any `--as` wipes the state. there is no
       *            output to pin, and the statement is what parts a deliberate absence from an
       *            owed one.
       */
      then('blocker state has count > 0', () => {
        expect(scene.blockerCountBeforeAs).toBeGreaterThan(0);
      });
    });

    when('[t1] route.stone.set --as passed succeeds', () => {
      const result = useThen('stone passes', async () =>
        invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1', as: 'passed' },
          cwd: scene.tempDir,
        }),
      );

      then('exit code is 0', () => {
        expect(result.code).toEqual(0);
      });

      then('blocker state file is cleared', async () => {
        const statePath = path.join(
          scene.tempDir,
          '.route',
          '.drive.blockers.latest.json',
        );
        const exists = await isPathFound(statePath);
        expect(exists).toBe(false);
      });

      then('stdout has good vibes', () => {
        // .why = this is a real guard-tree pass with two promised self-reviews behind it —
        //        the densest human-read output in the case, and it was unpinned
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });

      then('stderr has good vibes', () => {
        // 🔴 .why = the pass path emits progress events through a cli emit context, so
        //    stderr is a real caller-faced stream on this variant and not a dead one.
        //    it was pinned by neither a snapshot nor an assertion, so a regression that
        //    moved pass-path chatter onto stderr — or that left a progress teardown
        //    half-written — would keep this step green while the driver's experience
        //    changed (`ergo-contract-snapshots` nitpick.3 at i002). every sibling suite
        //    pins both streams; this one pinned one
        expect(sanitizeTimeForSnapshot(result.stderr)).toMatchSnapshot();
      });
    });

    when('[t2] route.drive invoked after pass', () => {
      const result = useThen('the drive advances to the next stone', async () =>
        invokeRouteSkill({
          skill: 'route.drive',
          args: { when: 'hook.onStop' },
          cwd: scene.tempDir,
        }),
      );

      then('stderr has stone content (same as stdout)', () => {
        expect(result.stderr).toContain('where were we?');
      });

      then('stderr has good vibes', () => {
        // 🔴 .why = the snapshot is what corrected this step's own NAME. its label read
        //    "block count resets to 1" until i018, and the pinned output shows the drive on
        //    `stone = 2` with no count in it at all — the case never read a count and never
        //    could. ⇒ the label claimed a subject the assertions did not touch, which is the
        //    same defect as a test whose title and assertion disagree. the snapshot is what
        //    made it visible, and it is the argument for the rule that asked for it
        //    (`rule.require.snapshot-every-journey-step`, `repo-rules` blocker.1 at i018)
        expect(sanitizeTimeForSnapshot(result.stderr)).toMatchSnapshot();
      });
    });
  });

  given('[case6] hook mode allows stop when blocked on approval', () => {
    const JOURNEY_ASSETS_DIR = path.join(__dirname, '.test/assets/route-journey');

    const scene = useBeforeAll(async () => {
      const tempDir = genTempDirForRhachet({
        slug: 'drive-case6',
        clone: JOURNEY_ASSETS_DIR,
      });

      // link the driver role
      await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });

      // create feature branch
      await execAsync('git checkout -b vlad/test-drive-case6', { cwd: tempDir });

      // bind the route
      await invokeRouteSkill({
        skill: 'route.bind.set',
        args: { route: '.' },
        cwd: tempDir,
      });

      // create artifact for 1.vision (which has approved? judge)
      await fs.writeFile(
        path.join(tempDir, '1.vision.md'),
        '# Vision\n\nBuild a weather API.',
      );

      return { tempDir };
    });

    when('[t0] route.drive hook.onStop mode before pass attempt', () => {
      const result = useThen('route.drive blocks (no blocker file)', async () =>
        invokeRouteSkill({
          skill: 'route.drive',
          args: { when: 'hook.onStop' },
          cwd: scene.tempDir,
        }),
      );

      then('exit code is 2 (block - agent hasnt tried to pass)', () => {
        // no blocker file yet = agent should keep work
        expect(result.code).toEqual(2);
      });

      then('stderr has stone content (same as stdout)', () => {
        expect(result.stderr).toContain('where were we?');
      });

      then('stdout has good vibes', () => {
        // 🔴 .why = this journey drives five real cli steps and pinned none of them, so a
        //    regression that re-worded the halt, moved it between streams, or dropped the
        //    approve command from the tree would keep every `toContain` green
        //    (`ergo-contract-snapshots` blocker.1 at i004)
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });

      then('stderr has good vibes', () => {
        expect(sanitizeTimeForSnapshot(result.stderr)).toMatchSnapshot();
      });
    });

    when('[t1] agent attempts to pass stone', () => {
      const result = useThen('route.stone.set fails on approval', async () =>
        invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1.vision', as: 'passed' },
          cwd: scene.tempDir,
        }),
      );

      then('exit code is non-zero (blocked)', () => {
        expect(result.code).not.toEqual(0);
      });

      then('stdout has good vibes', () => {
        // .why = the approval judge's refusal is the caller-faced negative path of
        //        `route.stone.set`, and an exit-code boolean says naught about what it read
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });

      then('stderr has good vibes', () => {
        expect(sanitizeTimeForSnapshot(result.stderr)).toMatchSnapshot();
      });
    });

    when('[t2] route.drive hook.onStop mode after blocked on approval', () => {
      const result = useThen('route.drive allows stop', async () =>
        invokeRouteSkill({
          skill: 'route.drive',
          args: { when: 'hook.onStop' },
          cwd: scene.tempDir,
        }),
      );

      then('exit code is 0 (allow stop)', () => {
        expect(result.code).toEqual(0);
      });

      then('stdout shows approval needed', () => {
        expect(result.stdout).toContain('halted, human approval required');
      });

      then('stdout shows approve command', () => {
        expect(result.stdout).toContain('route.stone.set');
        expect(result.stdout).toContain('--as approved');
      });

      then('stdout has good vibes', () => {
        // 🔴 .why = the densest step of the journey — the halt, its reason, and the exact
        //    command that lifts it. three `toContain` phrases graded a whole tree
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });

      then('stderr has good vibes', () => {
        // 🔴 .note = this pin is EMPTY, and the empty is the claim. the allow-stop render is
        //    a stdout-only variant, so `""` asserts stderr stays silent here — a regression
        //    that split the halt across both streams goes red. ⇒ an empty PIN is not an
        //    absent pin; it is the one shape that can catch a stream move
        expect(sanitizeTimeForSnapshot(result.stderr)).toMatchSnapshot();
      });
    });

    when('[t3] human grants approval', () => {
      const result = useThen('approval succeeds', async () =>
        invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1.vision', as: 'approved' },
          cwd: scene.tempDir,
        }),
      );

      then('exit code is 0', () => {
        expect(result.code).toEqual(0);
      });

      then('stdout has good vibes', () => {
        // .why = the approval grant is a human-faced mutation, and it was graded by an
        //        exit code alone
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });

      then('stderr has good vibes', () => {
        // .note = EMPTY by design — the approve path draws no progress spinner, so `""`
        //         asserts stderr stays clean on a grant that succeeds
        expect(sanitizeTimeForSnapshot(result.stderr)).toMatchSnapshot();
      });
    });

    when('[t4] route.drive hook.onStop invoked after approval', () => {
      const result = useThen('route.drive blocks (work remains)', async () =>
        invokeRouteSkill({
          skill: 'route.drive',
          args: { when: 'hook.onStop' },
          cwd: scene.tempDir,
        }),
      );

      then('exit code is 2 (block)', () => {
        // approval granted means agent CAN proceed (run pass)
        // so we should block stop, not allow it
        expect(result.code).toEqual(2);
      });

      then('stderr has stone content (same as stdout)', () => {
        expect(result.stderr).toContain('where were we?');
      });

      then('stdout has good vibes', () => {
        // .why = the post-approval render is what tells the driver the road is open again;
        //        a `toContain` of four words cannot see it go empty
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });

      then('stderr has good vibes', () => {
        expect(sanitizeTimeForSnapshot(result.stderr)).toMatchSnapshot();
      });
    });
  });

  given('[case7] no route bound', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDirForRhachet({
        slug: 'drive-case4',
        clone: ASSETS_DIR,
      });

      // link the driver role but do NOT bind route
      await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });

      return { tempDir };
    });

    when('[t0] route.drive is invoked', () => {
      const result = useThen('route.drive returns unbound message', async () =>
        invokeRouteSkill({
          skill: 'route.drive',
          args: {},
          cwd: scene.tempDir,
        }),
      );

      then('exit code is 0', () => {
        expect(result.code).toEqual(0);
      });

      then('stdout shows unbound message', () => {
        expect(result.stdout).toContain('where were we?');
        expect(result.stdout).toContain('dunno, route not bound');
      });

      then('stdout has good vibes', () => {
        // 🔴 .why = the not-bound render is a caller-faced negative path of `route.drive`,
        //    and the help + bound-route variants in this same file are pinned while this one
        //    was graded by two `toContain` phrases (`ergo-contract-snapshots` blocker.2 at
        //    i004). a re-word, a re-order, or a move onto stderr would stay green
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });

      then('stderr has good vibes', () => {
        // .note = EMPTY by design — the not-bound render is stdout-only, so `""` is what
        //         catches a later hand that routes the guidance onto stderr
        expect(sanitizeTimeForSnapshot(result.stderr)).toMatchSnapshot();
      });
    });
  });

  given('[case8] the --help flag', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDirForRhachet({
        slug: 'drive-help',
        clone: ASSETS_DIR,
      });
      // link the driver role; --help needs no bound route (it is static)
      await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });
      return { tempDir };
    });

    when('[t0] route.drive is invoked with --help', () => {
      const result = useThen('route.drive prints its help', async () =>
        invokeRouteSkill({
          skill: 'route.drive',
          args: { help: true },
          cwd: scene.tempDir,
        }),
      );

      then('exit code is 0', () => {
        expect(result.code).toEqual(0);
      });

      then('stdout documents the halt-state output block', () => {
        // this diff added the `output:` block that documents the halt states;
        // snapshot it so the help surface cannot drift undetected
        expect(result.stdout).toContain('output:');
        expect(result.stdout).toContain('halted');
      });

      then('stdout matches snapshot', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });
  });
});
