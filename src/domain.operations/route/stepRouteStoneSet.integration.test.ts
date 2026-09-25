import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { given, then, useBeforeAll, useThen, when } from 'test-fns';

import { genContextReviewBrainSupplyDemo } from './__test_assets__/genContextReviewBrainSupplyDemo';
import { getSelfReviewArticulationPath } from './guard/review/self/getSelfReviewArticulationPath';
import { stepRouteStoneSet } from './stepRouteStoneSet';

const ASSETS_DIR = path.join(__dirname, '.test/assets');

const noopContext = { ...genContextReviewBrainSupplyDemo(), isTTY: true };

/**
 * .what = backdate triggered.since mtime to bypass time enforcement
 * .why = tests need to verify promise flow without 90 second wait
 *
 * .note = only .since files are backdated; .uptil stays current (simulates proper wait)
 * .note = backdates ALL matched .since files (there may be multiple with different hashes)
 */
const backdateTriggeredReport = async (input: {
  tempDir: string;
  stone: string;
  slug: string;
}): Promise<void> => {
  const routeDir = path.join(input.tempDir, '.route');

  // 🔴 ENOENT only. this read FEEDS A MUTATION — a bare `.catch(() => [])` turns an EACCES,
  // EISDIR, or EMFILE into an empty list, so the back-date becomes a silent no-op and every
  // case downstream runs against a FRESH ask where it wanted an elapsed one. the suite then
  // grades the wrong branch and goes green
  // (`rule.forbid.failhide`; `arch-hazards-maintenance` nitpick.1 at i017)
  const files = await fs
    .readdir(routeDir)
    .catch((error: NodeJS.ErrnoException) => {
      if (error.code === 'ENOENT') return [] as string[];
      throw error;
    });
  const sinceFiles = files.filter(
    (f) =>
      f.includes(`${input.stone}.guard.selfreview.${input.slug}`) &&
      f.endsWith('.triggered.since'),
  );
  const mtimePast = new Date(Date.now() - 91 * 1000);
  for (const sinceFile of sinceFiles) {
    const filepath = path.join(routeDir, sinceFile);
    await fs.utimes(filepath, mtimePast, mtimePast);
  }
};

describe('stepRouteStoneSet.integration', () => {
  given('[case1] set stone as passed with guard execution', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = path.join(
        os.tmpdir(),
        `test-step-set-guard-${Date.now()}`,
      );
      await fs.mkdir(tempDir, { recursive: true });
      await fs.writeFile(path.join(tempDir, '1.test.stone'), '# Test');
      await fs.writeFile(
        path.join(tempDir, '1.test.guard'),
        [
          'artifacts:',
          '  - "$route/1.test*.md"',
          'reviews:',
          '  - echo "blockers: 0\\nnitpicks: 0"',
          'judges:',
          '  - echo "passed: true\\nreason: clean"',
        ].join('\n'),
      );
      await fs.writeFile(path.join(tempDir, '1.test.md'), '# Artifact');
      return { tempDir };
    });

    afterAll(async () => {
      await fs.rm(scene.tempDir, { recursive: true, force: true });
    });

    when('[t0] --as passed triggers guard', () => {
      const result = useThen('operation succeeds', async () =>
        stepRouteStoneSet(
          { stone: '1.test', route: scene.tempDir, as: 'passed' },
          noopContext,
        ),
      );

      then('executes reviews and judges', () => {
        expect(result.passed).toBe(true);
        expect(result.refs?.reviews.length).toBeGreaterThan(0);
        expect(result.refs?.judges.length).toBeGreaterThan(0);
      });

      then('appends passage to passage.jsonl on success', async () => {
        const passagePath = path.join(scene.tempDir, '.route', 'passage.jsonl');
        const content = await fs.readFile(passagePath, 'utf-8');
        expect(content).toContain('"stone":"1.test"');
        expect(content).toContain('"status":"passed"');
      });
    });
  });

  given('[case2] set stone as approved then passed', () => {
    const tempDir = path.join(
      os.tmpdir(),
      `test-step-set-approve-pass-${Date.now()}`,
    );

    beforeEach(async () => {
      await fs.cp(path.join(ASSETS_DIR, 'route.guarded'), tempDir, {
        recursive: true,
      });
      // create artifact
      await fs.writeFile(path.join(tempDir, '1.vision.md'), '# Vision');
    });

    afterEach(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    when('[t0] approved then passed workflow', () => {
      then('approve appends to passage.jsonl', async () => {
        const approveResult = await stepRouteStoneSet(
          {
            stone: '1.vision',
            route: tempDir,
            as: 'approved',
          },
          noopContext,
        );
        expect(approveResult.approved).toBe(true);
        const passagePath = path.join(tempDir, '.route', 'passage.jsonl');
        const content = await fs.readFile(passagePath, 'utf-8');
        expect(content).toContain('"stone":"1.vision"');
        expect(content).toContain('"status":"approved"');
      });
    });
  });

  given('[case3] route.simple fixture (no guards)', () => {
    const tempDir = path.join(
      os.tmpdir(),
      `test-step-set-simple-${Date.now()}`,
    );

    beforeEach(async () => {
      await fs.cp(path.join(ASSETS_DIR, 'route.simple'), tempDir, {
        recursive: true,
      });
      await fs.writeFile(path.join(tempDir, '1.vision.md'), '# Vision');
    });

    afterEach(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    when('[t0] --as passed with no guard', () => {
      then('auto-passes immediately', async () => {
        const result = await stepRouteStoneSet(
          {
            stone: '1.vision',
            route: tempDir,
            as: 'passed',
          },
          noopContext,
        );
        expect(result.passed).toBe(true);
        expect(result.refs?.reviews).toEqual([]);
        expect(result.refs?.judges).toEqual([]);
      });
    });
  });

  /**
   * .note = this case once read `[case4] time enforcement`. no promise is enforced by time
   *         now — the clock decides whether the encouragement renders, never whether the
   *         promise passes. the case is re-aimed at the cue rather than deleted.
   */
  given('[case4] the haste cue for review.self promises', () => {
    const tempDir = path.join(
      os.tmpdir(),
      `test-step-set-time-enforce-${Date.now()}`,
    );

    const owedPath = getSelfReviewArticulationPath({
      route: tempDir,
      stone: '1.vision',
      slug: 'all-done',
    });

    beforeEach(async () => {
      await fs.cp(path.join(ASSETS_DIR, 'route.review.self'), tempDir, {
        recursive: true,
      });
      // create artifact for 1.vision
      await fs.writeFile(path.join(tempDir, '1.vision.md'), '# Vision');
    });

    afterEach(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    when('[t0] the promise lands inside the window of the ask', () => {
      /**
       * .what = the ask, then BOTH promises, back to back — the act, declared once.
       * .why  = the two promises used to run inside one `then` beside their own
       *         assertions, so one block carried two execution paths and a reader could
       *         not tell which assertion graded which command
       *         (`rule.require.given-when-then` — one concern per `then`).
       * 🟡 .why the act still holds both: they are ONE arc. the second command's whole
       *         claim is that it follows the first with no wait, so to split the act
       *         would be to delete the property under test.
       */
      const attempts = useThen('both promises run back to back', async () => {
        // the ask
        await stepRouteStoneSet(
          { stone: '1.vision', route: tempDir, as: 'passed' },
          noopContext,
        );

        // .note = the articulation is written AFTER the ask, which is the real order: the
        //         guard asks, then the driver reads and writes. a fixture that writes it
        //         first constructs a file that predates the question, and the freshness bar
        //         correctly refuses it — a `stale` verdict, never the cue under test
        await fs.mkdir(path.dirname(owedPath), { recursive: true });
        await fs.writeFile(owedPath, '# self-review\n');

        const asPromise = async () =>
          stepRouteStoneSet(
            {
              stone: '1.vision',
              route: tempDir,
              as: 'promised',
              that: 'all-done',
              into: owedPath,
            },
            noopContext,
          );

        // promise at once — inside the window — then again, with no wait between them
        return { first: await asPromise(), second: await asPromise() };
      });

      then('the cue renders on the first', () => {
        expect(attempts.first.challenged).toBe(true);
        expect(attempts.first.promised).toBeUndefined();
        expect(attempts.first.emit?.stdout).toContain('patience');
      });

      // .why = the cue demands NO wait. the very next command clears, with no elapsed
      //        time between them — which is the whole of the wish's requirement 1
      then('the next command clears, with no wait', () => {
        expect(attempts.second.promised).toBe(true);
        expect(attempts.second.challenged).toBeUndefined();
      });
    });

    when('[t1] the promise lands outside the window of the ask', () => {
      then('no cue renders — it clears on the FIRST command', async () => {
        // the ask
        await stepRouteStoneSet(
          { stone: '1.vision', route: tempDir, as: 'passed' },
          noopContext,
        );

        // back-date the ask, so the promise reads as the thorough driver's
        await backdateTriggeredReport({
          tempDir,
          stone: '1.vision',
          slug: 'all-done',
        });

        // .note = written AFTER the ask, as [t0] does. the ask is back-dated 39min, so this
        //         file is comfortably newer than it and the freshness bar passes — the
        //         verdict under test is the CUE's absence, never a stale or absent path
        await fs.mkdir(path.dirname(owedPath), { recursive: true });
        await fs.writeFile(owedPath, '# self-review\n');

        const result = await stepRouteStoneSet(
          {
            stone: '1.vision',
            route: tempDir,
            as: 'promised',
            that: 'all-done',
            into: owedPath,
          },
          noopContext,
        );

        expect(result.promised).toBe(true);
        expect(result.challenged).toBeUndefined();
      });
    });
  });

  /**
   * .note = this case once read `[case5] plowthrough via 3 attempts on same hash`, and
   *         asserted the liveness hatch: three promises on one hash cleared the wait.
   *         the hatch is RETIRED — its `attempts` count is half the cue's own condition
   *         now, so the cue opens on attempt 2 and no hatch has work left to do.
   *         ⚠️ the hatch was also UNREACHABLE for the driver it existed to serve: attempts
   *         were counted per-hash, and a driver who repairs is on a new hash each time.
   *         the case is re-aimed at the bound that replaced it, never deleted.
   */
  given('[case5] the cue fires at most once per slug', () => {
    const tempDir = path.join(
      os.tmpdir(),
      `test-step-set-plowthrough-${Date.now()}`,
    );

    const owedPath = getSelfReviewArticulationPath({
      route: tempDir,
      stone: '1.vision',
      slug: 'all-done',
    });

    beforeEach(async () => {
      await fs.cp(path.join(ASSETS_DIR, 'route.review.self'), tempDir, {
        recursive: true,
      });
      // create artifact for 1.vision
      await fs.writeFile(path.join(tempDir, '1.vision.md'), '# Vision');
    });

    afterEach(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    when('[t0] the driver promises twice inside the window', () => {
      const attempts = useThen(
        'both promises run back to back, with no wait between them',
        async () => {
          // the ask
          await stepRouteStoneSet(
            { stone: '1.vision', route: tempDir, as: 'passed' },
            noopContext,
          );

          // .note = written AFTER the ask — the real order. see [case4] for why a fixture
          //         that writes it first meets the freshness bar rather than the cue under test
          await fs.mkdir(path.dirname(owedPath), { recursive: true });
          await fs.writeFile(owedPath, '# self-review\n');

          const asPromise = async () =>
            stepRouteStoneSet(
              {
                stone: '1.vision',
                route: tempDir,
                as: 'promised',
                that: 'all-done',
                into: owedPath,
              },
              noopContext,
            );

          // 1st promise → the cue renders; attempts goes 0 → 1
          const first = await asPromise();
          // 2nd promise → `attempts === 0` no longer holds, so the cue cannot fire again
          const second = await asPromise();
          return { first, second };
        },
      );

      then('the 1st promise is confronted by the cue', () => {
        expect(attempts.first.challenged).toBe(true);
      });

      /**
       * 🔴 .why this half carries the round = a cue that could repeat is a WALL, and a wall
       *    is exactly what this round removed. the 2nd promise runs with no wait after the
       *    1st, so a still-green assertion here is the whole of requirement 1
       */
      then('the 2nd clears — the cue cannot fire twice', () => {
        expect(attempts.second.promised).toBe(true);
        expect(attempts.second.challenged).toBeUndefined();
      });
    });
  });
});
