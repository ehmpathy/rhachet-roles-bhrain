import { execSync } from 'child_process';
import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { getError, given, then, when } from 'test-fns';

import { PassageReport } from '@src/domain.objects/Driver/PassageReport';

import { setPassageReport } from '../passage/setPassageReport';
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
      // initialize git repo (required by getGitRepoRoot)
      execSync('git init', { cwd: tempDir, stdio: 'ignore' });
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

      then('appends passage to passage.jsonl', async () => {
        await setStoneAsPassed(
          { stone: '1.vision', route: tempDir },
          noopContext,
        );
        const passagePath = path.join(tempDir, '.route', 'passage.jsonl');
        const content = await fs.readFile(passagePath, 'utf-8');
        expect(content).toContain('"stone":"1.vision"');
        expect(content).toContain('"status":"passed"');
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
        execSync('git init', { cwd: tempDir, stdio: 'ignore' });
        await fs.writeFile(path.join(tempDir, '1.test.stone'), '# Test');
        await fs.writeFile(
          path.join(tempDir, '1.test.guard'),
          'artifacts:\n  - "$route/1.test*.md"\nreviews:\n  - echo "blockers: 0"\njudges: []',
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
      execSync('git init', { cwd: tempDir, stdio: 'ignore' });
      await fs.writeFile(path.join(tempDir, '1.test.stone'), '# Test');
      await fs.writeFile(
        path.join(tempDir, '1.test.guard'),
        'artifacts:\n  - "$route/1.test*.md"\nreviews: []\njudges: []',
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

  given('[case4] guard with review.selfs', () => {
    const tempDir = path.join(
      os.tmpdir(),
      `test-set-passed-review.self-${Date.now()}`,
    );

    beforeEach(async () => {
      await fs.mkdir(tempDir, { recursive: true });
      execSync('git init', { cwd: tempDir, stdio: 'ignore' });
      await fs.writeFile(path.join(tempDir, '1.test.stone'), '# Test');
      await fs.writeFile(
        path.join(tempDir, '1.test.guard'),
        `artifacts:
  - "$route/1.test*.md"
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
      then('blocks with review.self required', async () => {
        const result = await setStoneAsPassed(
          {
            stone: '1.test',
            route: tempDir,
          },
          noopContext,
        );
        expect(result.passed).toBe(false);
        expect(result.emit?.stdout).toContain('review.self required');
        expect(result.emit?.stdout).toContain('lets reflect');
        expect(result.emit?.stdout).toContain('review.self 1/2');
        expect(result.emit?.stdout).toContain('slug = all-done');
      });
    });

    when('[t1] set passed with partial promises', () => {
      then('blocks with next unpromised review', async () => {
        // create promise for first review (hashless — firm checkpoint)
        const routeDir = path.join(tempDir, '.route');
        await fs.mkdir(routeDir, { recursive: true });

        // create hashless promise artifact for all-done
        await fs.writeFile(
          path.join(routeDir, '1.test.guard.promise.all-done.md'),
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
        expect(result.emit?.stdout).toContain('review.self required');
        expect(result.emit?.stdout).toContain('review.self 2/2');
        expect(result.emit?.stdout).toContain('slug = tests-pass');
      });
    });
  });

  given('[case5] guard with malfunctioned reviewer', () => {
    const tempDir = path.join(
      os.tmpdir(),
      `test-set-passed-malfunction-${Date.now()}`,
    );

    beforeEach(async () => {
      await fs.mkdir(tempDir, { recursive: true });
      execSync('git init', { cwd: tempDir, stdio: 'ignore' });
      await fs.writeFile(path.join(tempDir, '1.test.stone'), '# Test');
      // guard with a review that exits with code 1 (malfunction)
      await fs.writeFile(
        path.join(tempDir, '1.test.guard'),
        `artifacts:
  - "$route/1.test*.md"
reviews:
  peer:
    - slug: malfunctioner
      run: exit 1
      budget: 1
      level: 1
judges:
  - echo "passed: true"`,
      );
      await fs.writeFile(path.join(tempDir, '1.test.md'), '# Artifact');
    });

    afterEach(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    when('[t0] no overrule marker', () => {
      then('blocks due to malfunction', async () => {
        const result = await setStoneAsPassed(
          {
            stone: '1.test',
            route: tempDir,
          },
          noopContext,
        );
        expect(result.passed).toBe(false);
        expect(result.emit?.stdout).toContain('passage = malfunction');
      });
    });

    when('[t1] overrule marker present', () => {
      then('passes despite malfunction (human overruled)', async () => {
        // create overrule marker
        await setPassageReport({
          report: new PassageReport({
            stone: '1.test',
            status: 'overruled',
          }),
          route: tempDir,
        });

        const result = await setStoneAsPassed(
          {
            stone: '1.test',
            route: tempDir,
          },
          noopContext,
        );
        // overrule should bypass malfunction
        expect(result.passed).toBe(true);
        expect(result.emit?.stdout).toContain('overruled');
      });
    });
  });

  given('[case6] guard with constrained reviewer (exit 2, blockers 0)', () => {
    const tempDir = path.join(
      os.tmpdir(),
      `test-set-passed-constraint-${Date.now()}`,
    );

    beforeEach(async () => {
      await fs.mkdir(tempDir, { recursive: true });
      execSync('git init', { cwd: tempDir, stdio: 'ignore' });
      await fs.writeFile(path.join(tempDir, '1.test.stone'), '# Test');
      // guard with a review that exits with code 2 but reports 0 blockers (constraint)
      await fs.writeFile(
        path.join(tempDir, '1.test.guard'),
        `artifacts:
  - "$route/1.test*.md"
reviews:
  peer:
    - slug: constrainer
      run: sh -c 'echo blockers: 0; exit 2'
      budget: 1
      level: 1
judges:
  - echo "passed: true"`,
      );
      await fs.writeFile(path.join(tempDir, '1.test.md'), '# Artifact');
    });

    afterEach(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    when('[t0] no overrule marker', () => {
      then('blocks due to constraint', async () => {
        const result = await setStoneAsPassed(
          {
            stone: '1.test',
            route: tempDir,
          },
          noopContext,
        );
        expect(result.passed).toBe(false);
        expect(result.emit?.stdout).toContain('passage = blocked');
        expect(result.emit?.stdout).toContain('reviewer constraint');
      });
    });

    when('[t1] overrule marker present', () => {
      then('passes despite constraint (human overruled)', async () => {
        // create overrule marker
        await setPassageReport({
          report: new PassageReport({
            stone: '1.test',
            status: 'overruled',
          }),
          route: tempDir,
        });

        const result = await setStoneAsPassed(
          {
            stone: '1.test',
            route: tempDir,
          },
          noopContext,
        );
        // overrule should bypass constraint
        expect(result.passed).toBe(true);
        expect(result.emit?.stdout).toContain('overruled');
      });
    });
  });
});
