import * as fs from 'fs/promises';
import * as path from 'path';
import { given, then, useBeforeAll, useThen, when } from 'test-fns';

import { answerEveryPeerGiven } from './.test/answerEveryPeerGiven';
import {
  execAsync,
  genTempDirForRhachet,
  invokeRouteSkill,
  sanitizeTimeForSnapshot,
} from './.test/invokeRouteSkill';

const ASSETS_DIR = path.join(__dirname, '.test/assets/route-malfunction');

/**
 * .what = acceptance tests for malfunction behavior
 * .why = verifies two behaviors:
 *   1. malfunction then pass unblocks hook (last status wins)
 *   2. reviewer malfunction not cached (only successes cached)
 */
describe('driver.route.malfunction.acceptance', () => {
  given('[case1] malfunction then pass unblocks hook', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDirForRhachet({
        slug: 'malfunction-case1',
        clone: ASSETS_DIR,
      });

      // link the driver role
      await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });

      // create feature branch
      await execAsync('git checkout -b vlad/test-malfunction-case1', {
        cwd: tempDir,
      });

      // bind the route
      await invokeRouteSkill({
        skill: 'route.bind.set',
        args: { route: '.' },
        cwd: tempDir,
      });

      // create artifact
      await fs.writeFile(
        path.join(tempDir, '1.feature.md'),
        '# Feature\n\nImplemented.',
      );

      // write malfunction status to passage.jsonl (prior malfunction state)
      await fs.mkdir(path.join(tempDir, '.route'), { recursive: true });
      await fs.writeFile(
        path.join(tempDir, '.route', 'passage.jsonl'),
        '{"stone":"1.feature","status":"malfunction"}\n',
      );

      return { tempDir };
    });

    when('[t0] route.drive hook mode with only malfunction in passage', () => {
      const result = useThen('route.drive halts on malfunction', async () =>
        invokeRouteSkill({
          skill: 'route.drive',
          args: { when: 'hook.onBoot' },
          cwd: scene.tempDir,
        }),
      );

      then('exit code is 0 (onBoot never blocks boot)', () => {
        // onBoot is a session-start hook: it surfaces the malfunction message
        // (a halt disposition), but always exits 0 — it never blocks the boot.
        // the escalation reaches the human via the stderr message, not the code.
        // (onStop malfunction exits 1; see stepRouteDrive.integration case12.)
        expect(result.code).toEqual(0);
      });

      then('stderr mentions malfunction', () => {
        const combined = result.stdout + result.stderr;
        expect(combined.toLowerCase()).toContain('malfunction');
      });

      then('stdout matches snapshot', () => {
        // snap the onBoot halt render so the malfunction-halt state is
        // reconstructable from snapshots alone
        // (rule.require.snapshot-every-journey-step)
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });

    when('[t1] passed status is appended after malfunction', () => {
      const result = useThen('append passed and drive hook', async () => {
        // append passed status (last entry wins)
        await fs.appendFile(
          path.join(scene.tempDir, '.route', 'passage.jsonl'),
          '{"stone":"1.feature","status":"passed"}\n',
        );

        return invokeRouteSkill({
          skill: 'route.drive',
          args: { when: 'hook.onBoot' },
          cwd: scene.tempDir,
        });
      });

      then('exit code is 0 (hook allows stop)', () => {
        expect(result.code).toEqual(0);
      });

      then('passage.jsonl has both entries', async () => {
        const content = await fs.readFile(
          path.join(scene.tempDir, '.route', 'passage.jsonl'),
          'utf-8',
        );
        const lines = content.trim().split('\n');
        expect(lines).toHaveLength(2);
        expect(lines[0]).toContain('"malfunction"');
        expect(lines[1]).toContain('"passed"');
      });

      then('stdout matches snapshot', () => {
        // snap the onBoot render after 'passed' supersedes 'malfunction' so the
        // cleared-halt state is reconstructable from snapshots alone
        // (rule.require.snapshot-every-journey-step)
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });
  });

  given('[case2] reviewer malfunction not cached', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDirForRhachet({
        slug: 'malfunction-case2',
        clone: ASSETS_DIR,
      });

      // link the driver role
      await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });

      // create feature branch
      await execAsync('git checkout -b vlad/test-malfunction-case2', {
        cwd: tempDir,
      });

      // bind the route
      await invokeRouteSkill({
        skill: 'route.bind.set',
        args: { route: '.' },
        cwd: tempDir,
      });

      // make mock-reviewer.sh executable
      await execAsync('chmod +x .test/mock-reviewer.sh', { cwd: tempDir });

      // create artifact
      await fs.writeFile(
        path.join(tempDir, '1.feature.md'),
        '# Feature\n\nImplemented.',
      );

      return { tempDir };
    });

    when('[t0] reviewer malfunctions (exit 1)', () => {
      const result = useThen('route.stone.set triggers malfunction', async () => {
        // set flag to make reviewer malfunction
        await fs.writeFile(
          path.join(scene.tempDir, '.test', 'reviewer-should-malfunction'),
          '',
        );

        // answer whatever the prior round left owed, before this one is entered.
        // a no-op on the first arrival; on every later one it is what the entrance
        // gate now requires — an edit alone no longer buys re-entry
        await answerEveryPeerGiven({ cwd: scene.tempDir, stone: '1.feature' });

        return invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1.feature', as: 'passed' },
          cwd: scene.tempDir,
        });
      });

      then('exit code is non-zero (malfunction)', () => {
        expect(result.code).not.toEqual(0);
      });

      then('output mentions malfunction', () => {
        const combined = result.stdout + result.stderr;
        expect(combined.toLowerCase()).toContain('malfunction');
      });

      then('review artifact was created with malfunction', async () => {
        const reviewsDir = path.join(scene.tempDir, '.reviews', 'peer');
        const files = await fs.readdir(reviewsDir);
        const reviewFiles = files.filter(
          (f) => f.includes('._.review.') && f.endsWith('.md'),
        );
        expect(reviewFiles.length).toBeGreaterThan(0);

        // check first review artifact contains malfunction
        const reviewPath = path.join(reviewsDir, reviewFiles[0]!);
        const content = await fs.readFile(reviewPath, 'utf-8');
        expect(content).toContain('malfunction');
      });

      then('the malfunction tree is pinned — the reviewer is marked malfunction and the stone is blocked', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });

    when('[t1] reviewer is fixed and re-run', () => {
      const result = useThen('fresh review runs (not cached)', async () => {
        // remove malfunction flag
        await fs.rm(
          path.join(scene.tempDir, '.test', 'reviewer-should-malfunction'),
        );

        // set flag to make reviewer pass
        await fs.writeFile(
          path.join(scene.tempDir, '.test', 'reviewer-should-pass'),
          '',
        );

        // count review artifacts before
        const reviewsDir = path.join(scene.tempDir, '.reviews', 'peer');
        const filesBefore = await fs.readdir(reviewsDir);
        const reviewFilesBefore = filesBefore.filter(
          (f) => f.includes('._.review.') && f.endsWith('.md'),
        );
        const countBefore = reviewFilesBefore.length;

        // answer whatever the prior round left owed, before this one is entered.
        // a no-op on the first arrival; on every later one it is what the entrance
        // gate now requires — an edit alone no longer buys re-entry
        await answerEveryPeerGiven({ cwd: scene.tempDir, stone: '1.feature' });

        // attempt pass again
        const passResult = await invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1.feature', as: 'passed' },
          cwd: scene.tempDir,
        });

        // count review artifacts after
        const filesAfter = await fs.readdir(reviewsDir);
        const reviewFilesAfter = filesAfter.filter(
          (f) => f.includes('._.review.') && f.endsWith('.md'),
        );
        const countAfter = reviewFilesAfter.length;

        return {
          passResult,
          countBefore,
          countAfter,
          reviewFilesAfter,
        };
      });

      then('exit code is 0 (pass succeeds)', () => {
        expect(result.passResult.code).toEqual(0);
      });

      then('new review artifact was created (not cached malfunction)', () => {
        // fresh review should have created a new artifact
        expect(result.countAfter).toBeGreaterThan(result.countBefore);
      });

      then('latest review artifact shows pass (not malfunction)', async () => {
        // sort by name to get latest (includes iteration number)
        const sorted = result.reviewFilesAfter.sort();
        const latestFile = sorted[sorted.length - 1]!;
        const reviewsDir = path.join(scene.tempDir, '.reviews', 'peer');
        const content = await fs.readFile(
          path.join(reviewsDir, latestFile),
          'utf-8',
        );
        expect(content).toContain('review passed');
        expect(content).not.toContain('malfunction');
      });

      then(
        '⛔ the guard summary still says malfunction 💥 while the round says approved — a DEFECT, snapped as-is',
        () => {
          // 🔴 THIS SNAPSHOT PINS A DEFECT, DELIBERATELY, AND IT IS NOT THE CONTRACT.
          //
          //    one emit, two verdicts for one artifact. the round tree at the top prints
          //    `r1: bash … approved · 0 blockers ✓`; the `🗿 route.stone.set` guard summary
          //    below prints the SAME slug, SAME iteration, SAME `given:` path as
          //    `malfunction 💥`. a driver who reads the screen cannot tell which holds.
          //
          // 🔴 the seam is INSIDE one row, and it is a two-source read:
          //      `formatGuardTree.ts:227` — the VERDICT is `meter.verdict`
          //      `formatGuardTree.ts:228` — the PATH is `review?.artifact.path ?? meter.path`
          //    so the row prints the LIVE artifact's path under the METER's verdict, with no
          //    reconciliation between them. that is why the two trees cite one identical path.
          //
          //    the meter's verdict is the stale half. `getAllReviewPeerMeterStatuses.ts:105`
          //    selects the reviewer's artifact with `.find((r) => r.index === reviewer.index)`
          //    over every artifact at the hash, and `enumRouteGuardReviewPeerFiles` returns
          //    raw `globby` order with no sort — so when two rounds share ONE hash, `.find`
          //    can return the earlier one. they share a hash here because the reviewer's
          //    `.test/` flag file is not in `artifacts:`: the fix that made the reviewer
          //    pass moved no hashed byte, so i001 (malfunction) and i002 (pass) sit at the
          //    same hash under the same index.
          //
          // ⚠️ it is PRIOR to this branch — the index key predates this behavior, and neither
          //    P1 nor P2 touches it. the repair is the SAME operation as `[case7][t3]` of
          //    `routeStoneSetContemplation.acceptance.test.ts`, which pins the identical
          //    class under the identical label. caught as
          //    `.dream/v2026_09_05.fix.guard-review-cache-is-keyed-by-index-not-slug.md`,
          //    itemized as fulcrums F9 (the key) and F10 (this second surface) — ruled as a
          //    PAIR, never separately.
          //
          // ⇒ the snapshot is kept because it is the CLAMP: the day the key is corrected,
          //   this goes red and hands the fixer the exact before-and-after. what it must
          //   never do is read as approval — which is what this title exists to prevent
          //   (r5 blocker.1 + r7 blocker.1, i016: an unlabelled contradictory render of a
          //   surface a human reads).
          expect(
            sanitizeTimeForSnapshot(result.passResult.stdout),
          ).toMatchSnapshot();
        },
      );
    });
  });

  given('[case3] reviewer constraint not cached', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDirForRhachet({
        slug: 'malfunction-case3',
        clone: ASSETS_DIR,
      });

      // link the driver role
      await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });

      // create feature branch
      await execAsync('git checkout -b vlad/test-malfunction-case3', {
        cwd: tempDir,
      });

      // bind the route
      await invokeRouteSkill({
        skill: 'route.bind.set',
        args: { route: '.' },
        cwd: tempDir,
      });

      // make mock-reviewer.sh executable
      await execAsync('chmod +x .test/mock-reviewer.sh', { cwd: tempDir });

      // create artifact
      await fs.writeFile(
        path.join(tempDir, '1.feature.md'),
        '# Feature\n\nImplemented.',
      );

      return { tempDir };
    });

    when('[t0] reviewer finds constraints (exit 2)', () => {
      const result = useThen('route.stone.set triggers constraint', async () => {
        // set flag to make reviewer find constraints
        await fs.writeFile(
          path.join(scene.tempDir, '.test', 'reviewer-should-constraint'),
          '',
        );

        // answer whatever the prior round left owed, before this one is entered.
        // a no-op on the first arrival; on every later one it is what the entrance
        // gate now requires — an edit alone no longer buys re-entry
        await answerEveryPeerGiven({ cwd: scene.tempDir, stone: '1.feature' });

        return invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1.feature', as: 'passed' },
          cwd: scene.tempDir,
        });
      });

      then('exit code is non-zero (constraint blocks)', () => {
        expect(result.code).not.toEqual(0);
      });

      then('review artifact was created', async () => {
        const reviewsDir = path.join(scene.tempDir, '.reviews', 'peer');
        const files = await fs.readdir(reviewsDir);
        const reviewFiles = files.filter(
          (f) => f.includes('._.review.') && f.endsWith('.md'),
        );
        expect(reviewFiles.length).toBeGreaterThan(0);
      });

      then('the constraint tree is pinned — the reviewer is marked constraint and the stone is blocked', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });

    when('[t1] artifact fixed and re-run', () => {
      const result = useThen('fresh review runs (not cached)', async () => {
        // remove constraint flag
        await fs.rm(
          path.join(scene.tempDir, '.test', 'reviewer-should-constraint'),
        );

        // set flag to make reviewer pass
        await fs.writeFile(
          path.join(scene.tempDir, '.test', 'reviewer-should-pass'),
          '',
        );

        // count review artifacts before
        const reviewsDir = path.join(scene.tempDir, '.reviews', 'peer');
        const filesBefore = await fs.readdir(reviewsDir);
        const reviewFilesBefore = filesBefore.filter(
          (f) => f.includes('._.review.') && f.endsWith('.md'),
        );
        const countBefore = reviewFilesBefore.length;

        // answer whatever the prior round left owed, before this one is entered.
        // a no-op on the first arrival; on every later one it is what the entrance
        // gate now requires — an edit alone no longer buys re-entry
        await answerEveryPeerGiven({ cwd: scene.tempDir, stone: '1.feature' });

        // attempt pass again
        const passResult = await invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1.feature', as: 'passed' },
          cwd: scene.tempDir,
        });

        // count review artifacts after
        const filesAfter = await fs.readdir(reviewsDir);
        const reviewFilesAfter = filesAfter.filter(
          (f) => f.includes('._.review.') && f.endsWith('.md'),
        );
        const countAfter = reviewFilesAfter.length;

        return {
          passResult,
          countBefore,
          countAfter,
          reviewFilesAfter,
        };
      });

      then('exit code is 0 (pass succeeds)', () => {
        expect(result.passResult.code).toEqual(0);
      });

      then('new review artifact was created (not cached constraint)', () => {
        // fresh review should have created a new artifact
        expect(result.countAfter).toBeGreaterThan(result.countBefore);
      });

      then('latest review artifact shows pass', async () => {
        // sort by name to get latest (includes iteration number)
        const sorted = result.reviewFilesAfter.sort();
        const latestFile = sorted[sorted.length - 1]!;
        const reviewsDir = path.join(scene.tempDir, '.reviews', 'peer');
        const content = await fs.readFile(
          path.join(reviewsDir, latestFile),
          'utf-8',
        );
        expect(content).toContain('review passed');
      });

      then(
        '⛔ the guard summary still says constraint ✋ while the round says approved — a DEFECT, snapped as-is',
        () => {
          // 🔴 THIS SNAPSHOT PINS A DEFECT, DELIBERATELY, AND IT IS NOT THE CONTRACT.
          //
          //    the same contradiction `[case2][t1]` pins, at the OTHER terminal exit class:
          //    the round tree prints the reviewer `approved`, the `🗿 route.stone.set` guard
          //    summary prints the same slug/iteration/path as `constraint ✋`.
          //
          // 🔴 why BOTH cases are kept rather than one. the stale read is keyed on an index,
          //    never on an exit class — so it can serve back either, and the two leave
          //    `asReviewerTreeStateFromMeter` by SEPARATE branches, each with its own
          //    `state.type`: `formatGuardTree.ts:227` (malfunction 💥) and `:243`
          //    (constraint ✋). one case clamps one branch. a repair that corrected the key
          //    for one class and missed the other would go green there and stay broken here.
          //
          // ⚠️ PRIOR to this branch; P1/P2 touch neither. same dream, same fulcrum pair —
          //    `.dream/v2026_09_05.fix.guard-review-cache-is-keyed-by-index-not-slug.md`,
          //    F9 (the key) + F10 (this surface), ruled together.
          //
          // ⇒ kept as the CLAMP; labelled so it can never read as approval
          //   (r5 blocker.1 + r7 blocker.1, i016).
          expect(
            sanitizeTimeForSnapshot(result.passResult.stdout),
          ).toMatchSnapshot();
        },
      );
    });
  });
});
