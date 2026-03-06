import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { given, then, useBeforeAll, useThen, when } from 'test-fns';

import { setStoneAsPassed } from './setStoneAsPassed';

const ASSETS_DIR = path.join(__dirname, '../.test/assets');

const noopContext = { cliEmit: { onGuardProgress: () => {} } };

describe('setStoneAsPassed.integration', () => {
  given('[case1] guard with echo review and judge commands', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = path.join(
        os.tmpdir(),
        `test-set-passed-guard-${Date.now()}`,
      );
      await fs.mkdir(tempDir, { recursive: true });
      await fs.writeFile(path.join(tempDir, '1.test.stone'), '# Test stone');
      await fs.writeFile(
        path.join(tempDir, '1.test.guard'),
        [
          'artifacts:',
          '  - 1.test*.md',
          'reviews:',
          '  - echo "blockers: 0\\nnitpicks: 1\\ntest review"',
          'judges:',
          '  - echo "passed: true\\nreason: all checks passed"',
        ].join('\n'),
      );
      await fs.writeFile(path.join(tempDir, '1.test.md'), '# Test artifact');
      return { tempDir };
    });

    afterAll(async () => {
      await fs.rm(scene.tempDir, { recursive: true, force: true });
    });

    when('[t0] stone is set as passed', () => {
      const result = useThen('operation succeeds', async () =>
        setStoneAsPassed(
          { stone: '1.test', route: scene.tempDir },
          noopContext,
        ),
      );

      then('runs review command', async () => {
        expect(result.refs.reviews.length).toBeGreaterThan(0);
        const reviewPath = result.refs.reviews[0];
        expect(reviewPath).toBeDefined();
        const reviewContent = await fs.readFile(reviewPath!, 'utf-8');
        expect(reviewContent).toContain('blockers: 0');
      });

      then('runs judge command', async () => {
        expect(result.refs.judges.length).toBeGreaterThan(0);
        const judgePath = result.refs.judges[0];
        expect(judgePath).toBeDefined();
        const judgeContent = await fs.readFile(judgePath!, 'utf-8');
        expect(judgeContent).toContain('passed: true');
      });

      then('marks stone as passed when judge passes', () => {
        expect(result.passed).toBe(true);
      });
    });
  });

  given('[case2] guard with judge that fails', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = path.join(
        os.tmpdir(),
        `test-set-passed-fail-${Date.now()}`,
      );
      await fs.mkdir(tempDir, { recursive: true });
      await fs.writeFile(path.join(tempDir, '1.test.stone'), '# Test stone');
      await fs.writeFile(
        path.join(tempDir, '1.test.guard'),
        [
          'artifacts:',
          '  - 1.test*.md',
          'reviews: []',
          'judges:',
          '  - echo "passed: false\\nreason: blockers found"',
        ].join('\n'),
      );
      await fs.writeFile(path.join(tempDir, '1.test.md'), '# Test artifact');
      return { tempDir };
    });

    afterAll(async () => {
      await fs.rm(scene.tempDir, { recursive: true, force: true });
    });

    when('[t0] judge fails', () => {
      const result = useThen('operation completes', async () =>
        setStoneAsPassed(
          { stone: '1.test', route: scene.tempDir },
          noopContext,
        ),
      );

      then('returns passed false', () => {
        expect(result.passed).toBe(false);
      });

      then('includes rejection reason in emit', () => {
        expect(result.emit?.stdout).toContain('blocked');
        expect(result.emit?.stdout).toContain('blockers found');
      });
    });
  });

  given('[case3] reuse prior review/judge artifacts', () => {
    const tempDir = path.join(
      os.tmpdir(),
      `test-set-passed-reuse-${Date.now()}`,
    );

    beforeEach(async () => {
      await fs.mkdir(tempDir, { recursive: true });
      await fs.writeFile(path.join(tempDir, '1.test.stone'), '# Test stone');
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
      await fs.writeFile(path.join(tempDir, '1.test.md'), '# Test artifact');
    });

    afterEach(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    when('[t0] set passed is called twice with same artifact', () => {
      then('reuses prior review and judge files', async () => {
        // first call
        const result1 = await setStoneAsPassed(
          {
            stone: '1.test',
            route: tempDir,
          },
          noopContext,
        );
        expect(result1.passed).toBe(true);

        // reset passage state to test again
        await fs.rm(path.join(tempDir, '.route', 'passage.jsonl'));

        // second call - should reuse artifacts
        const result2 = await setStoneAsPassed(
          {
            stone: '1.test',
            route: tempDir,
          },
          noopContext,
        );
        expect(result2.passed).toBe(true);
        // same paths means reused
        expect(result2.refs.reviews).toEqual(result1.refs.reviews);
        expect(result2.refs.judges).toEqual(result1.refs.judges);
      });
    });
  });

  given('[case4] review.self guard creates trigger marker file', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = path.join(
        os.tmpdir(),
        `test-set-passed-trigger-${Date.now()}`,
      );
      await fs.cp(path.join(ASSETS_DIR, 'route.review.self'), tempDir, {
        recursive: true,
      });
      await fs.writeFile(path.join(tempDir, '1.vision.md'), '# Vision');
      return { tempDir };
    });

    afterAll(async () => {
      await fs.rm(scene.tempDir, { recursive: true, force: true });
    });

    when('[t0] stone with review.self is set as passed', () => {
      const result = useThen('operation completes', async () =>
        setStoneAsPassed(
          { stone: '1.vision', route: scene.tempDir },
          noopContext,
        ),
      );

      then('is blocked by review.self requirement', () => {
        expect(result.passed).toBe(false);
      });

      then('creates trigger marker files', async () => {
        const routeDir = path.join(scene.tempDir, '.route');
        const files = await fs.readdir(routeDir);
        const sinceFiles = files.filter((f) => f.endsWith('.triggered.since'));

        expect(sinceFiles.length).toBeGreaterThan(0);
        expect(sinceFiles[0]).toContain('1.vision.guard.selfreview');
        expect(sinceFiles[0]).toContain('all-done');
      });

      then('trigger marker file has correct content', async () => {
        const routeDir = path.join(scene.tempDir, '.route');
        const files = await fs.readdir(routeDir);
        const sinceFile = files.find((f) => f.endsWith('.triggered.since'));

        const content = await fs.readFile(
          path.join(routeDir, sinceFile!),
          'utf-8',
        );
        expect(content).toContain('slug: all-done');
        expect(content).toContain('hash:');
      });
    });
  });
});
