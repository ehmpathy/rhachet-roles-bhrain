import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { given, then, useBeforeAll, useThen, when } from 'test-fns';

import { stepRouteStoneSet } from './stepRouteStoneSet';

const ASSETS_DIR = path.join(__dirname, '.test/assets');

const noopContext = { cliEmit: { onGuardProgress: () => {} }, isTTY: true };

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
  const files = await fs.readdir(routeDir).catch(() => []);
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
          '  - 1.test*.md',
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

  given('[case4] time enforcement for review.self promises', () => {
    const tempDir = path.join(
      os.tmpdir(),
      `test-step-set-time-enforce-${Date.now()}`,
    );

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

    when('[t0] promise attempted before 30 seconds', () => {
      then('blocks with challenged status', async () => {
        // first trigger via --as passed
        await stepRouteStoneSet(
          { stone: '1.vision', route: tempDir, as: 'passed' },
          noopContext,
        );

        // immediately promise (no backdate = < 30 seconds)
        const result = await stepRouteStoneSet(
          {
            stone: '1.vision',
            route: tempDir,
            as: 'promised',
            that: 'all-done',
          },
          noopContext,
        );

        expect(result.challenged).toBe(true);
        expect(result.promised).toBeUndefined();
        expect(result.emit?.stdout).toContain('patience');
      });
    });

    when('[t1] promise attempted after 30 seconds', () => {
      then('accepts promise', async () => {
        // first trigger via --as passed
        await stepRouteStoneSet(
          { stone: '1.vision', route: tempDir, as: 'passed' },
          noopContext,
        );

        // backdate to simulate 30+ seconds elapsed
        await backdateTriggeredReport({
          tempDir,
          stone: '1.vision',
          slug: 'all-done',
        });

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
        expect(result.challenged).toBeUndefined();
      });
    });
  });

  given('[case5] plowthrough via 3 attempts on same hash', () => {
    const tempDir = path.join(
      os.tmpdir(),
      `test-step-set-plowthrough-${Date.now()}`,
    );

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

    when('[t0] promise attempted 3 times on same hash', () => {
      then('accepts promise on 3rd attempt (plowthrough)', async () => {
        // 1st attempt → challenged
        const result1 = await stepRouteStoneSet(
          {
            stone: '1.vision',
            route: tempDir,
            as: 'promised',
            that: 'all-done',
          },
          noopContext,
        );
        expect(result1.challenged).toBe(true);

        // 2nd attempt → challenged
        const result2 = await stepRouteStoneSet(
          {
            stone: '1.vision',
            route: tempDir,
            as: 'promised',
            that: 'all-done',
          },
          noopContext,
        );
        expect(result2.challenged).toBe(true);

        // 3rd attempt → allowed (plowthrough)
        const result3 = await stepRouteStoneSet(
          {
            stone: '1.vision',
            route: tempDir,
            as: 'promised',
            that: 'all-done',
          },
          noopContext,
        );
        expect(result3.promised).toBe(true);
        expect(result3.challenged).toBeUndefined();
      });
    });
  });
});
