import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { given, then, when } from 'test-fns';

import { setStoneAsPassed } from './setStoneAsPassed';

const noopContext = { cliEmit: { onGuardProgress: () => {} } };

describe('setStoneAsPassed.integration', () => {
  given('[case1] guard with echo review and judge commands', () => {
    const tempDir = path.join(
      os.tmpdir(),
      `test-set-passed-guard-${Date.now()}`,
    );

    beforeEach(async () => {
      // create route with guard that uses echo commands
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
    });

    afterEach(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    when('[t0] stone is set as passed', () => {
      then('runs review command', async () => {
        const result = await setStoneAsPassed(
          {
            stone: '1.test',
            route: tempDir,
          },
          noopContext,
        );
        expect(result.refs.reviews.length).toBeGreaterThan(0);
        // verify review file created
        const reviewPath = result.refs.reviews[0];
        expect(reviewPath).toBeDefined();
        const reviewContent = await fs.readFile(reviewPath!, 'utf-8');
        expect(reviewContent).toContain('blockers: 0');
      });

      then('runs judge command', async () => {
        const result = await setStoneAsPassed(
          {
            stone: '1.test',
            route: tempDir,
          },
          noopContext,
        );
        expect(result.refs.judges.length).toBeGreaterThan(0);
        // verify judge file created
        const judgePath = result.refs.judges[0];
        expect(judgePath).toBeDefined();
        const judgeContent = await fs.readFile(judgePath!, 'utf-8');
        expect(judgeContent).toContain('passed: true');
      });

      then('marks stone as passed when judge passes', async () => {
        const result = await setStoneAsPassed(
          {
            stone: '1.test',
            route: tempDir,
          },
          noopContext,
        );
        expect(result.passed).toBe(true);
      });
    });
  });

  given('[case2] guard with judge that fails', () => {
    const tempDir = path.join(
      os.tmpdir(),
      `test-set-passed-fail-${Date.now()}`,
    );

    beforeEach(async () => {
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
    });

    afterEach(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    when('[t0] judge fails', () => {
      then('returns passed false', async () => {
        const result = await setStoneAsPassed(
          {
            stone: '1.test',
            route: tempDir,
          },
          noopContext,
        );
        expect(result.passed).toBe(false);
      });

      then('includes rejection reason in emit', async () => {
        const result = await setStoneAsPassed(
          {
            stone: '1.test',
            route: tempDir,
          },
          noopContext,
        );
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

        // reset passage marker to test again
        await fs.rm(path.join(tempDir, '.route', '1.test.passed'));

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
});
