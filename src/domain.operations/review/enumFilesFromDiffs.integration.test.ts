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
  given('[case1] --diffs since-main', () => {
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
          range: 'since-main',
          cwd: scene.repoPath,
        });
        expect(files).toContain('src/new-file.ts');
        expect(files).toContain('src/valid.ts');
      });
    });
  });

  given('[case2] --diffs since-commit', () => {
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
          range: 'since-commit',
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
          range: 'since-commit',
          cwd: scene.repoPath,
        });
        expect(files).toContain('src/staged.ts');
      });
    });
  });

  given('[case3] --diffs since-staged', () => {
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
          range: 'since-staged',
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
          range: 'since-commit',
          cwd: scene.repoPath,
        });
        expect(files).toEqual([]);
      });
    });
  });

  given('[case5] --diffs since-main with unrebased branch (no remote)', () => {
    const scene = usePrep(async () => {
      const { repoPath, cleanup } = setupTestRepo();

      // create feature branch from main and add a change
      execSync('git checkout -b feature', { cwd: repoPath });
      fs.writeFileSync(
        path.join(repoPath, 'src/feature-file.ts'),
        'export const feature = true;',
      );
      execSync('git add .', { cwd: repoPath });
      execSync('git commit -m "feature commit"', {
        cwd: repoPath,
        env: GIT_ENV,
      });

      // go back to main and add a different commit (simulates another PR merged)
      execSync('git checkout main', { cwd: repoPath });
      fs.writeFileSync(
        path.join(repoPath, 'src/other-pr-file.ts'),
        'export const otherPr = true;',
      );
      execSync('git add .', { cwd: repoPath });
      execSync('git commit -m "other pr merged to main"', {
        cwd: repoPath,
        env: GIT_ENV,
      });

      // go back to feature branch (now unrebased - main has moved forward)
      execSync('git checkout feature', { cwd: repoPath });

      return { repoPath, cleanup };
    });

    afterAll(() => scene.cleanup());

    when('[t0] main has commits not in feature branch', () => {
      then(
        'returns only feature branch changes, not main changes',
        async () => {
          const files = await enumFilesFromDiffs({
            range: 'since-main',
            cwd: scene.repoPath,
          });

          // should include the feature branch file
          expect(files).toContain('src/feature-file.ts');

          // should NOT include the other PR file that was merged to main
          // (this is the key assertion - before the merge-base fix, this would fail)
          expect(files).not.toContain('src/other-pr-file.ts');
        },
      );

      then('returns correct count of changed files', async () => {
        const files = await enumFilesFromDiffs({
          range: 'since-main',
          cwd: scene.repoPath,
        });

        // only 1 file changed on our branch
        expect(files).toHaveLength(1);
      });
    });
  });

  given(
    '[case6] --diffs since-main compares against origin/main not local main',
    () => {
      const scene = usePrep(async () => {
        // create a bare repo to act as "origin"
        const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'review-origin-'));
        const originPath = path.join(tmpDir, 'origin.git');
        const repoPath = path.join(tmpDir, 'repo');

        // init bare repo
        fs.mkdirSync(originPath);
        execSync('git init --bare', { cwd: originPath });

        // clone it to local repo
        execSync(`git clone "${originPath}" repo`, { cwd: tmpDir });

        // copy example files and make initial commit
        const assetPath =
          'src/domain.operations/review/.test/assets/example.repo';
        fs.cpSync(assetPath, repoPath, { recursive: true });
        execSync('git add .', { cwd: repoPath });
        execSync('git commit -m "initial"', { cwd: repoPath, env: GIT_ENV });
        execSync('git branch -M main', { cwd: repoPath });
        execSync('git push -u origin main', { cwd: repoPath });

        // create feature branch and add a change
        execSync('git checkout -b feature', { cwd: repoPath });
        fs.writeFileSync(
          path.join(repoPath, 'src/feature-file.ts'),
          'export const feature = true;',
        );
        execSync('git add .', { cwd: repoPath });
        execSync('git commit -m "feature commit"', {
          cwd: repoPath,
          env: GIT_ENV,
        });

        // simulate: another PR gets merged to origin/main (not via our local main)
        // we do this by: checkout main, commit, push, then go back to feature
        execSync('git checkout main', { cwd: repoPath });
        fs.writeFileSync(
          path.join(repoPath, 'src/other-pr-on-origin.ts'),
          'export const otherPr = true;',
        );
        execSync('git add .', { cwd: repoPath });
        execSync('git commit -m "other pr merged to origin/main"', {
          cwd: repoPath,
          env: GIT_ENV,
        });
        execSync('git push origin main', { cwd: repoPath });

        // now make another commit on local main that is NOT pushed
        // this simulates local main with extra commits that origin/main lacks
        fs.writeFileSync(
          path.join(repoPath, 'src/local-only-file.ts'),
          'export const localOnly = true;',
        );
        execSync('git add .', { cwd: repoPath });
        execSync('git commit -m "local only commit not on origin"', {
          cwd: repoPath,
          env: GIT_ENV,
        });

        // go back to feature branch
        execSync('git checkout feature', { cwd: repoPath });

        const cleanup = () =>
          fs.rmSync(tmpDir, { recursive: true, force: true });
        return { repoPath, cleanup };
      });

      afterAll(() => scene.cleanup());

      when('[t0] local main has commits not on origin/main', () => {
        then('compares against origin/main, not local main', async () => {
          const files = await enumFilesFromDiffs({
            range: 'since-main',
            cwd: scene.repoPath,
          });

          // should include the feature branch file
          expect(files).toContain('src/feature-file.ts');

          // should NOT include the file that was pushed to origin/main
          // (merge-base with origin/main excludes it)
          expect(files).not.toContain('src/other-pr-on-origin.ts');

          // should NOT include the local-only file that exists only on local main
          // (we compare against origin/main, so local main divergence is ignored)
          expect(files).not.toContain('src/local-only-file.ts');
        });

        then('returns only feature branch changes', async () => {
          const files = await enumFilesFromDiffs({
            range: 'since-main',
            cwd: scene.repoPath,
          });

          // only 1 file: our feature branch change
          expect(files).toHaveLength(1);
          expect(files).toEqual(['src/feature-file.ts']);
        });
      });
    },
  );
});
