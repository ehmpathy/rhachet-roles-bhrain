import { execSync } from 'child_process';
import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { getError, given, then, when } from 'test-fns';

import { genContextReviewBrainSupplyDemo } from './__test_assets__/genContextReviewBrainSupplyDemo';
import { getSelfReviewArticulationPath } from './guard/review/self/getSelfReviewArticulationPath';
import { stepRouteStoneSet } from './stepRouteStoneSet';

const ASSETS_DIR = path.join(__dirname, '.test/assets');

const noopContext = { ...genContextReviewBrainSupplyDemo(), isTTY: true };

describe('stepRouteStoneSet', () => {
  given('[case1] set stone as passed', () => {
    const tempDir = path.join(
      os.tmpdir(),
      `test-step-set-passed-${Date.now()}`,
    );

    beforeEach(async () => {
      await fs.cp(path.join(ASSETS_DIR, 'route.simple'), tempDir, {
        recursive: true,
      });
      // initialize git repo (required by getGitRepoRoot)
      execSync('git init', { cwd: tempDir, stdio: 'ignore' });
      // create artifact for 1.vision
      await fs.writeFile(path.join(tempDir, '1.vision.md'), '# Vision');
    });

    afterEach(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    when('[t0] --as passed with artifact present', () => {
      then('dispatches to setStoneAsPassed', async () => {
        const result = await stepRouteStoneSet(
          {
            stone: '1.vision',
            route: tempDir,
            as: 'passed',
          },
          noopContext,
        );
        expect(result.passed).toBe(true);
        expect(result.emit?.stdout).toContain('passage = allowed');
      });

      then('returns refs object', async () => {
        const result = await stepRouteStoneSet(
          {
            stone: '1.vision',
            route: tempDir,
            as: 'passed',
          },
          noopContext,
        );
        expect(result.refs).toBeDefined();
        expect(result.refs?.reviews).toEqual([]);
        expect(result.refs?.judges).toEqual([]);
      });
    });
  });

  given('[case2] set stone as approved', () => {
    const tempDir = path.join(
      os.tmpdir(),
      `test-step-set-approved-${Date.now()}`,
    );

    beforeEach(async () => {
      await fs.cp(path.join(ASSETS_DIR, 'route.simple'), tempDir, {
        recursive: true,
      });
      // initialize git repo (required by getGitRepoRoot)
      execSync('git init', { cwd: tempDir, stdio: 'ignore' });
    });

    afterEach(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    when('[t0] --as approved', () => {
      then('dispatches to setStoneAsApproved', async () => {
        const result = await stepRouteStoneSet(
          {
            stone: '1.vision',
            route: tempDir,
            as: 'approved',
          },
          noopContext,
        );
        expect(result.approved).toBe(true);
        expect(result.emit?.stdout).toContain('✓ approved');
      });

      then('does not return refs', async () => {
        const result = await stepRouteStoneSet(
          {
            stone: '1.vision',
            route: tempDir,
            as: 'approved',
          },
          noopContext,
        );
        expect(result.refs).toBeUndefined();
      });
    });
  });

  given('[case3] invalid --as value', () => {
    const tempDir = path.join(
      os.tmpdir(),
      `test-step-set-invalid-${Date.now()}`,
    );

    beforeEach(async () => {
      await fs.cp(path.join(ASSETS_DIR, 'route.simple'), tempDir, {
        recursive: true,
      });
      // initialize git repo (required by getGitRepoRoot)
      execSync('git init', { cwd: tempDir, stdio: 'ignore' });
    });

    afterEach(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    when('[t0] --as has unsupported value', () => {
      then('throws unexpected code path error', async () => {
        const error = await getError(
          stepRouteStoneSet(
            {
              stone: '1.vision',
              route: tempDir,
              as: 'invalid' as 'passed' | 'approved',
            },
            noopContext,
          ),
        );
        expect(error).toBeInstanceOf(Error);
        expect(error.message).toContain('unsupported');
      });
    });
  });

  given('[case4] set stone as promised', () => {
    const tempDir = path.join(
      os.tmpdir(),
      `test-step-set-promised-${Date.now()}`,
    );

    /**
     * .what = backdate triggered.since mtime to bypass time enforcement
     * .why = tests need to verify promise flow without 90 second wait
     * .note = only .since is backdated; .uptil stays current (simulates proper wait)
     */
    const backdateTriggeredReport = async (input: {
      stone: string;
      slug: string;
    }): Promise<void> => {
      const routeDir = path.join(tempDir, '.route');
      const files = await fs.readdir(routeDir).catch(() => []);
      const sinceFile = files.find(
        (f) =>
          f.includes(`${input.stone}.guard.selfreview.${input.slug}`) &&
          f.endsWith('.triggered.since'),
      );
      if (sinceFile) {
        const filepath = path.join(routeDir, sinceFile);
        const mtimePast = new Date(Date.now() - 91 * 1000);
        await fs.utimes(filepath, mtimePast, mtimePast);
      }
    };

    beforeEach(async () => {
      await fs.cp(path.join(ASSETS_DIR, 'route.review.self'), tempDir, {
        recursive: true,
      });
      // initialize git repo (required by getGitRepoRoot)
      execSync('git init', { cwd: tempDir, stdio: 'ignore' });
      // create artifact for 1.vision
      await fs.writeFile(path.join(tempDir, '1.vision.md'), '# Vision');
      // create articulation file for 1.vision.r1.all-done (required by file presence check)
      // format: {route}/review/self/{stone}.r{index}.{slug}.md
      const articulationPath = getSelfReviewArticulationPath({
        route: tempDir,
        stone: '1.vision',
        index: 1,
        slug: 'all-done',
      });
      await fs.mkdir(path.dirname(articulationPath), { recursive: true });
      await fs.writeFile(articulationPath, '# self-review\n');
    });

    afterEach(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    when('[t0] --as promised without prior trigger', () => {
      then('blocks with challenged status', async () => {
        // promise without first call to --as passed (no trigger)
        const result = await stepRouteStoneSet(
          {
            stone: '1.vision',
            route: tempDir,
            as: 'promised',
            that: 'all-done',
          },
          noopContext,
        );
        // time enforcement: challenged because no prior trigger
        expect(result.challenged).toBe(true);
        expect(result.promised).toBeUndefined();
        expect(result.emit?.stdout).toContain('patience');
      });
    });

    when('[t1] --as promised after trigger and backdate', () => {
      then('records promise and returns promised true', async () => {
        // first trigger via --as passed
        await stepRouteStoneSet(
          {
            stone: '1.vision',
            route: tempDir,
            as: 'passed',
          },
          noopContext,
        );
        // backdate the triggered report to bypass 90s wait
        await backdateTriggeredReport({ stone: '1.vision', slug: 'all-done' });

        const result = await stepRouteStoneSet(
          {
            stone: '1.vision',
            route: tempDir,
            as: 'promised',
            that: 'all-done',
          },
          noopContext,
        );
        expect(result.promised).toBe(true);
        // per blueprint: shows "passage = progressed" not "promise = recorded"
        expect(result.emit?.stdout).toContain('passage = progressed');
        expect(result.emit?.stdout).toContain('review.self 1/2 promised');
        // per blueprint: shows next unpromised review (tests-pass)
        expect(result.emit?.stdout).toContain('tests-pass');
      });

      then('creates promise artifact file', async () => {
        // first trigger via --as passed
        await stepRouteStoneSet(
          {
            stone: '1.vision',
            route: tempDir,
            as: 'passed',
          },
          noopContext,
        );
        // backdate the triggered report
        await backdateTriggeredReport({ stone: '1.vision', slug: 'all-done' });

        await stepRouteStoneSet(
          {
            stone: '1.vision',
            route: tempDir,
            as: 'promised',
            that: 'all-done',
          },
          noopContext,
        );
        const routeDir = path.join(tempDir, '.route');
        const files = await fs.readdir(routeDir);
        const promiseFiles = files.filter((f) => f.includes('.promise.'));
        expect(promiseFiles.length).toBeGreaterThan(0);
        expect(promiseFiles[0]).toContain('all-done');
      });
    });

    when('[t2] --as promised without --that', () => {
      then('throws bad request error', async () => {
        const error = await getError(
          stepRouteStoneSet(
            {
              stone: '1.vision',
              route: tempDir,
              as: 'promised',
            },
            noopContext,
          ),
        );
        expect(error).toBeInstanceOf(Error);
        expect(error.message).toContain('--that is required');
      });
    });
  });

  given('[case5] set stone as arrived (alias for passed)', () => {
    const tempDir = path.join(
      os.tmpdir(),
      `test-step-set-arrived-${Date.now()}`,
    );

    beforeEach(async () => {
      await fs.cp(path.join(ASSETS_DIR, 'route.simple'), tempDir, {
        recursive: true,
      });
      // initialize git repo (required by getGitRepoRoot)
      execSync('git init', { cwd: tempDir, stdio: 'ignore' });
      // create artifact for 1.vision
      await fs.writeFile(path.join(tempDir, '1.vision.md'), '# Vision');
    });

    afterEach(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    when('[t0] --as arrived with artifact present', () => {
      then('behaves same as --as passed', async () => {
        const result = await stepRouteStoneSet(
          {
            stone: '1.vision',
            route: tempDir,
            as: 'arrived',
          },
          noopContext,
        );
        expect(result.passed).toBe(true);
        expect(result.emit?.stdout).toContain('passage = allowed');
      });

      then('returns refs object', async () => {
        const result = await stepRouteStoneSet(
          {
            stone: '1.vision',
            route: tempDir,
            as: 'arrived',
          },
          noopContext,
        );
        expect(result.refs).toBeDefined();
        expect(result.refs?.reviews).toEqual([]);
        expect(result.refs?.judges).toEqual([]);
      });
    });
  });

  // 🔴 the clamp for r10.n5 — a stance-only flag on a non-stance --as was DROPPED with no
  //    word before the guard. now it is refused loud, so a mistyped verb never eats a grade.
  //    fires before any fs access, so the bogus route is never read.
  given('[case6] a stance-only flag on a non-stance --as', () => {
    when('[t0] --as passed --severity urgent', () => {
      then('refuses, and names the stray flag', async () => {
        const error = await getError(
          stepRouteStoneSet(
            {
              stone: '1.vision',
              route: '/nonexistent/route',
              as: 'passed',
              severity: 'urgent',
            },
            noopContext,
          ),
        );
        expect(error).toBeInstanceOf(Error);
        expect(error.message).toContain('--severity is only accepted for');
        // 🔴 r009 i011 nitpick.2 — pinned whole; a mistyped-verb driver reads this
        //    message in full, and the taught commands inside it must stay correct
        expect(error.message).toMatchSnapshot();
      });
    });

    when('[t1] --as passed --why some/path', () => {
      then('refuses, and names --why', async () => {
        const error = await getError(
          stepRouteStoneSet(
            {
              stone: '1.vision',
              route: '/nonexistent/route',
              as: 'passed',
              why: '.fulcrums/inventory.of=fulcrums.case=F001.md',
            },
            noopContext,
          ),
        );
        expect(error).toBeInstanceOf(Error);
        expect(error.message).toContain('--why is only accepted for');
        expect(error.message).toMatchSnapshot();
      });
    });

    when('[t2] --as approved --with architect', () => {
      then('refuses, and names --with', async () => {
        const error = await getError(
          stepRouteStoneSet(
            {
              stone: '1.vision',
              route: '/nonexistent/route',
              as: 'approved',
              with: 'architect',
            },
            noopContext,
          ),
        );
        expect(error).toBeInstanceOf(Error);
        expect(error.message).toContain('--with is only accepted for');
        expect(error.message).toMatchSnapshot();
      });
    });
  });

  // 🔴 r009 i012 nitpick.1 — a stance names a PARTY and a SUBJECT; both refusals below
  //    teach a driver what to add. naught in the target drove them before this clamp
  given('[case7] a stance with an absent --with or --about', () => {
    when('[t0] --as disputed with no --with', () => {
      then('refuses, and names --with — pinned whole', async () => {
        const error = await getError(
          stepRouteStoneSet(
            {
              stone: '1.vision',
              route: '/nonexistent/route',
              as: 'disputed',
              about: 'blocker.1',
              why: '.fulcrums/inventory.of=fulcrums.case=F001.md',
            },
            noopContext,
          ),
        );
        expect(error).toBeInstanceOf(Error);
        expect(error.message).toContain('--with is required for --as disputed');
        expect(error.message).toMatchSnapshot();
      });
    });

    when('[t1] --as conceded with no --about', () => {
      then('refuses, and names --about — pinned whole', async () => {
        const error = await getError(
          stepRouteStoneSet(
            {
              stone: '1.vision',
              route: '/nonexistent/route',
              as: 'conceded',
              with: 'architect',
              severity: 'better',
            },
            noopContext,
          ),
        );
        expect(error).toBeInstanceOf(Error);
        expect(error.message).toContain(
          '--about is required for --as conceded',
        );
        expect(error.message).toMatchSnapshot();
      });
    });
  });
});
