import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { getError, given, then, when } from 'test-fns';

import { setStoneAsPassed } from './setStoneAsPassed';

const ASSETS_DIR = path.join(__dirname, '../.test/assets');

const noopContext = { cliEmit: { onGuardProgress: () => {} } };

describe('setStoneAsPassed', () => {
  given('[case1] route.simple fixture (no guards)', () => {
    const tempDir = path.join(
      os.tmpdir(),
      `test-set-passed-simple-${Date.now()}`,
    );

    beforeEach(async () => {
      // copy fixture to temp dir so we can modify it
      await fs.cp(path.join(ASSETS_DIR, 'route.simple'), tempDir, {
        recursive: true,
      });
      // create artifact for 1.vision
      await fs.writeFile(
        path.join(tempDir, '1.vision.md'),
        '# Vision\n\nTest vision content',
      );
    });

    afterEach(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    when('[t0] stone has artifact and no guard', () => {
      then('marks stone as passed', async () => {
        const result = await setStoneAsPassed(
          {
            stone: '1.vision',
            route: tempDir,
          },
          noopContext,
        );
        expect(result.passed).toBe(true);
        expect(result.emit?.stdout).toContain('passage = allowed (unguarded)');
      });

      then('creates passage marker', async () => {
        await setStoneAsPassed(
          { stone: '1.vision', route: tempDir },
          noopContext,
        );
        const passageExists = await fs
          .access(path.join(tempDir, '.route', '1.vision.passed'))
          .then(() => true)
          .catch(() => false);
        expect(passageExists).toBe(true);
      });
    });

    when('[t1] stone has no artifact', () => {
      then('throws artifact not found error', async () => {
        const error = await getError(
          setStoneAsPassed(
            { stone: '2.criteria', route: tempDir },
            noopContext,
          ),
        );
        expect(error).toBeInstanceOf(Error);
        expect(error.message).toContain('artifact not found');
      });
    });

    when('[t2] stone does not exist', () => {
      then('throws stone not found error', async () => {
        const error = await getError(
          setStoneAsPassed(
            { stone: 'nonexistent', route: tempDir },
            noopContext,
          ),
        );
        expect(error).toBeInstanceOf(Error);
        expect(error.message).toContain('stone not found');
      });
    });
  });

  given('[case2] route.guarded fixture (with guards)', () => {
    const routePath = path.join(ASSETS_DIR, 'route.guarded');

    when('[t0] guard has reviews but no judges', () => {
      then('throws guard has reviews but no judges error', async () => {
        // create a temp fixture with reviews but no judges
        const tempDir = path.join(
          os.tmpdir(),
          `test-set-passed-reviewonly-${Date.now()}`,
        );
        await fs.mkdir(tempDir, { recursive: true });
        await fs.writeFile(path.join(tempDir, '1.test.stone'), '# Test');
        await fs.writeFile(
          path.join(tempDir, '1.test.guard'),
          'artifacts:\n  - 1.test*.md\nreviews:\n  - echo "blockers: 0"\njudges: []',
        );
        await fs.writeFile(path.join(tempDir, '1.test.md'), '# Artifact');

        try {
          const error = await getError(
            setStoneAsPassed({ stone: '1.test', route: tempDir }, noopContext),
          );
          expect(error).toBeInstanceOf(Error);
          expect(error.message).toContain('guard has reviews but no judges');
        } finally {
          await fs.rm(tempDir, { recursive: true, force: true });
        }
      });
    });
  });

  given('[case3] guard with artifacts only (no reviews, no judges)', () => {
    const tempDir = path.join(
      os.tmpdir(),
      `test-set-passed-artifacts-only-${Date.now()}`,
    );

    beforeEach(async () => {
      await fs.mkdir(tempDir, { recursive: true });
      await fs.writeFile(path.join(tempDir, '1.test.stone'), '# Test');
      await fs.writeFile(
        path.join(tempDir, '1.test.guard'),
        'artifacts:\n  - 1.test*.md\nreviews: []\njudges: []',
      );
      await fs.writeFile(path.join(tempDir, '1.test.md'), '# Artifact');
    });

    afterEach(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    when('[t0] stone is set as passed', () => {
      then('auto-passes with artifacts only message', async () => {
        const result = await setStoneAsPassed(
          {
            stone: '1.test',
            route: tempDir,
          },
          noopContext,
        );
        expect(result.passed).toBe(true);
        expect(result.emit?.stdout).toContain('artifacts only');
      });
    });
  });

  given('[case4] guard with self-reviews', () => {
    const tempDir = path.join(
      os.tmpdir(),
      `test-set-passed-self-review-${Date.now()}`,
    );

    beforeEach(async () => {
      await fs.mkdir(tempDir, { recursive: true });
      await fs.writeFile(path.join(tempDir, '1.test.stone'), '# Test');
      await fs.writeFile(
        path.join(tempDir, '1.test.guard'),
        `artifacts:
  - 1.test*.md
reviews:
  self:
    - slug: all-done
      say: did you complete all items?
    - slug: tests-pass
      say: do all tests pass?
  peer:
    - echo "blockers: 0"
judges:
  - echo "passed: true"`,
      );
      await fs.writeFile(path.join(tempDir, '1.test.md'), '# Artifact');
    });

    afterEach(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    when('[t0] set passed with no promises', () => {
      then('blocks with self-review required', async () => {
        const result = await setStoneAsPassed(
          {
            stone: '1.test',
            route: tempDir,
          },
          noopContext,
        );
        expect(result.passed).toBe(false);
        expect(result.emit?.stdout).toContain('self-review required');
        expect(result.emit?.stdout).toContain("check yo'self");
        expect(result.emit?.stdout).toContain('review.self 1/2');
        expect(result.emit?.stdout).toContain('slug = all-done');
      });
    });

    when('[t1] set passed with partial promises', () => {
      then('blocks with next unpromised review', async () => {
        // create promise for first review
        const routeDir = path.join(tempDir, '.route');
        await fs.mkdir(routeDir, { recursive: true });

        // compute the hash using the same method as computeStoneReviewInputHash
        const crypto = await import('crypto');
        const artifactContent = `--- 1.test.md ---\n# Artifact`;
        const hash = crypto
          .createHash('sha256')
          .update(artifactContent)
          .digest('hex');

        // create promise artifact for all-done
        await fs.writeFile(
          path.join(routeDir, `1.test.guard.promise.all-done.${hash}.md`),
          '# promise: all-done',
        );

        const result = await setStoneAsPassed(
          {
            stone: '1.test',
            route: tempDir,
          },
          noopContext,
        );
        expect(result.passed).toBe(false);
        expect(result.emit?.stdout).toContain('self-review required');
        expect(result.emit?.stdout).toContain('review.self 2/2');
        expect(result.emit?.stdout).toContain('slug = tests-pass');
      });
    });
  });
});
