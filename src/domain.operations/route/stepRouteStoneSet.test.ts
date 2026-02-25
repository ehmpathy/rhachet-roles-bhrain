import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { getError, given, then, when } from 'test-fns';

import { stepRouteStoneSet } from './stepRouteStoneSet';

const ASSETS_DIR = path.join(__dirname, '.test/assets');

const noopContext = { cliEmit: { onGuardProgress: () => {} } };

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
        expect(result.emit?.stdout).toContain('approval = granted');
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
     * .what = backdate triggered report mtime to bypass time enforcement
     * .why = tests need to verify promise flow without 90 second wait
     */
    const backdateTriggeredReport = async (input: {
      stone: string;
      slug: string;
    }): Promise<void> => {
      const routeDir = path.join(tempDir, '.route');
      const files = await fs.readdir(routeDir).catch(() => []);
      const triggeredFile = files.find(
        (f) =>
          f.includes(`${input.stone}.guard.selfreview.${input.slug}`) &&
          f.endsWith('.triggered'),
      );
      if (triggeredFile) {
        const filepath = path.join(routeDir, triggeredFile);
        const mtimePast = new Date(Date.now() - 91 * 1000);
        await fs.utimes(filepath, mtimePast, mtimePast);
      }
    };

    beforeEach(async () => {
      await fs.cp(path.join(ASSETS_DIR, 'route.self-review'), tempDir, {
        recursive: true,
      });
      // create artifact for 1.vision
      await fs.writeFile(path.join(tempDir, '1.vision.md'), '# Vision');
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
        expect(result.emit?.stdout).toContain('self-review 1/2 promised');
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
});
