import { execSync } from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { given, then, usePrep, when } from 'test-fns';

import { enumFilesFromDiffs } from './enumFilesFromDiffs';

/**
 * .what = git identity env for commits
 * .why = avoids requiring global git config on cicd machines
 */
const GIT_ENV = {
  ...process.env,
  GIT_AUTHOR_NAME: 'Test User',
  GIT_AUTHOR_EMAIL: 'test@test.com',
  GIT_COMMITTER_NAME: 'Test User',
  GIT_COMMITTER_EMAIL: 'test@test.com',
};

/**
 * .what = creates an isolated git repo in tmp for testing
 * .why = avoids git-in-git issues when testing diff operations
 */
const setupTestRepo = (): { repoPath: string; cleanup: () => void } => {
  // create tmp directory
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'review-test-'));
  const repoPath = path.join(tmpDir, 'repo');

  // copy example.repo contents
  const assetPath = 'src/domain.operations/review/.test/assets/example.repo';
  fs.cpSync(assetPath, repoPath, { recursive: true });

  // initialize fresh git repo
  execSync('git init', { cwd: repoPath });
  execSync('git add .', { cwd: repoPath });
  execSync('git commit -m "initial"', { cwd: repoPath, env: GIT_ENV });

  // create main branch (in case default is different)
  execSync('git branch -M main', { cwd: repoPath });

  return {
    repoPath,
    cleanup: () => fs.rmSync(tmpDir, { recursive: true, force: true }),
  };
};

describe('enumFilesFromDiffs', () => {
  given('[case1] --diffs uptil-main', () => {
    const scene = usePrep(async () => {
      const { repoPath, cleanup } = setupTestRepo();

      // create a branch and make changes
      execSync('git checkout -b feature', { cwd: repoPath });
      fs.writeFileSync(
        path.join(repoPath, 'src/new-file.ts'),
        'export const x = 1;',
      );
      fs.appendFileSync(path.join(repoPath, 'src/valid.ts'), '\n// modified');
      execSync('git add .', { cwd: repoPath });
      execSync('git commit -m "feature changes"', {
        cwd: repoPath,
        env: GIT_ENV,
      });

      return { repoPath, cleanup };
    });

    afterAll(() => scene.cleanup());

    when('[t0] changes exist between HEAD and main', () => {
      then('returns changed files', async () => {
        const files = await enumFilesFromDiffs({
          range: 'uptil-main',
          cwd: scene.repoPath,
        });
        expect(files).toContain('src/new-file.ts');
        expect(files).toContain('src/valid.ts');
      });
    });
  });

  given('[case2] --diffs uptil-commit', () => {
    const scene = usePrep(async () => {
      const { repoPath, cleanup } = setupTestRepo();
      return { repoPath, cleanup };
    });

    afterAll(() => scene.cleanup());

    when('[t0] unstaged changes exist', () => {
      then('returns unstaged files', async () => {
        // make unstaged change
        fs.appendFileSync(
          path.join(scene.repoPath, 'src/valid.ts'),
          '\n// unstaged',
        );

        const files = await enumFilesFromDiffs({
          range: 'uptil-commit',
          cwd: scene.repoPath,
        });
        expect(files).toContain('src/valid.ts');
      });
    });

    when('[t1] staged changes exist', () => {
      then('returns staged files', async () => {
        // make staged change
        fs.writeFileSync(
          path.join(scene.repoPath, 'src/staged.ts'),
          'export const y = 2;',
        );
        execSync('git add src/staged.ts', { cwd: scene.repoPath });

        const files = await enumFilesFromDiffs({
          range: 'uptil-commit',
          cwd: scene.repoPath,
        });
        expect(files).toContain('src/staged.ts');
      });
    });
  });

  given('[case3] --diffs uptil-staged', () => {
    const scene = usePrep(async () => {
      const { repoPath, cleanup } = setupTestRepo();
      return { repoPath, cleanup };
    });

    afterAll(() => scene.cleanup());

    when('[t0] only staged changes', () => {
      then('returns only staged files', async () => {
        // make unstaged change (should NOT appear)
        fs.appendFileSync(
          path.join(scene.repoPath, 'src/valid.ts'),
          '\n// unstaged',
        );

        // make staged change (should appear)
        fs.writeFileSync(
          path.join(scene.repoPath, 'src/staged-only.ts'),
          'export const z = 3;',
        );
        execSync('git add src/staged-only.ts', { cwd: scene.repoPath });

        const files = await enumFilesFromDiffs({
          range: 'uptil-staged',
          cwd: scene.repoPath,
        });
        expect(files).toContain('src/staged-only.ts');
        expect(files).not.toContain('src/valid.ts');
      });
    });
  });

  given('[case4] no changes', () => {
    const scene = usePrep(async () => {
      const { repoPath, cleanup } = setupTestRepo();
      return { repoPath, cleanup };
    });

    afterAll(() => scene.cleanup());

    when('[t0] repo is clean', () => {
      then('returns empty array', async () => {
        const files = await enumFilesFromDiffs({
          range: 'uptil-commit',
          cwd: scene.repoPath,
        });
        expect(files).toEqual([]);
      });
    });
  });
});
