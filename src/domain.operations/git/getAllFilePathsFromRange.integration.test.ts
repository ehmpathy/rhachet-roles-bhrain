import { execSync } from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { given, then, usePrep, useThen, when } from 'test-fns';

import { getAllFilePathsFromRange } from './getAllFilePathsFromRange';

/**
 * .what = git identity env for commits
 * .why = avoids the need for global git config on cicd machines
 */
const GIT_ENV = {
  ...process.env,
  GIT_AUTHOR_NAME: 'Test User',
  GIT_AUTHOR_EMAIL: 'test@test.com',
  GIT_COMMITTER_NAME: 'Test User',
  GIT_COMMITTER_EMAIL: 'test@test.com',
};

/**
 * .what = a fresh repo on `main` with two committed files, then a `feature` branch
 * .why = each range reads a different slice of one tree, so one tree serves them all
 */
const setupTestRepo = (): { repoPath: string; cleanup: () => void } => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'paths-from-range-'));
  const repoPath = path.join(tmpDir, 'repo');
  fs.mkdirSync(path.join(repoPath, 'src'), { recursive: true });
  fs.writeFileSync(path.join(repoPath, 'src/kept.ts'), 'export const a = 1;\n');
  fs.writeFileSync(path.join(repoPath, 'src/gone.ts'), 'export const b = 2;\n');
  execSync('git init', { cwd: repoPath });
  execSync('git add .', { cwd: repoPath });
  execSync('git commit -m "initial"', { cwd: repoPath, env: GIT_ENV });
  execSync('git branch -M main', { cwd: repoPath });
  execSync('git checkout -b feature', { cwd: repoPath });
  return {
    repoPath,
    cleanup: () => fs.rmSync(tmpDir, { recursive: true, force: true }),
  };
};

/**
 * .what = integration tests for the path-only read of a range
 * .why = the parity with `getAllFileDiffsFromRange` is clamped in that suite
 *        (`[case12]`, `[case13]`); this one owns the operation's own contract —
 *        each range, the deleted-entry exclusion, and the order a caller reads
 */
describe('getAllFilePathsFromRange', () => {
  given(
    '[case1] a branch with a commit, a staged edit, and an unstaged edit',
    () => {
      const scene = usePrep(async () => {
        const { repoPath, cleanup } = setupTestRepo();

        // a committed new file, and a committed delete
        fs.writeFileSync(
          path.join(repoPath, 'src/added.ts'),
          'export const c = 3;\n',
        );
        execSync('git rm src/gone.ts', { cwd: repoPath });
        execSync('git add .', { cwd: repoPath });
        execSync('git commit -m "feature"', { cwd: repoPath, env: GIT_ENV });

        // a staged new file
        fs.writeFileSync(
          path.join(repoPath, 'src/staged.ts'),
          'export const d = 4;\n',
        );
        execSync('git add src/staged.ts', { cwd: repoPath });

        // an unstaged edit to a tracked file
        fs.appendFileSync(path.join(repoPath, 'src/kept.ts'), '// edit\n');

        return { repoPath, cleanup };
      });

      afterAll(() => scene.cleanup());

      when('[t0] read over since-main', () => {
        const read = useThen('the read succeeds', async () => ({
          paths: await getAllFilePathsFromRange({
            range: 'since-main',
            cwd: scene.repoPath,
          }),
        }));

        then('it holds every change on the branch that still exists', () => {
          expect([...read.paths].sort()).toEqual([
            'src/added.ts',
            'src/kept.ts',
            'src/staged.ts',
          ]);
        });

        then('🔴 the deleted path is omitted — it names no file', () => {
          expect(read.paths).not.toContain('src/gone.ts');
        });
      });

      when('[t1] read over since-staged', () => {
        then('it holds the staged file alone', async () => {
          const paths = await getAllFilePathsFromRange({
            range: 'since-staged',
            cwd: scene.repoPath,
          });
          expect(paths).toEqual(['src/staged.ts']);
        });
      });

      when('[t2] read over since-commit', () => {
        then('it holds the uncommitted changes, staged and not', async () => {
          const paths = await getAllFilePathsFromRange({
            range: 'since-commit',
            cwd: scene.repoPath,
          });
          expect([...paths].sort()).toEqual(['src/kept.ts', 'src/staged.ts']);
        });
      });
    },
  );

  given('[case2] a branch with no change at all', () => {
    const scene = usePrep(async () => setupTestRepo());

    afterAll(() => scene.cleanup());

    when('[t0] read over since-main', () => {
      then('it holds no path', async () => {
        const paths = await getAllFilePathsFromRange({
          range: 'since-main',
          cwd: scene.repoPath,
        });
        expect(paths).toEqual([]);
      });
    });
  });
});
