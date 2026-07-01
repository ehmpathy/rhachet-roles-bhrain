import { execSync } from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { given, then, usePrep, when } from 'test-fns';

import { getAllFileDiffsFromRange } from './getAllFileDiffsFromRange';

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
 * .what = creates an isolated git repo in tmp for the test
 * .why = avoids git-in-git issues when the test exercises diff operations
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

describe('getAllFileDiffsFromRange', () => {
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
      then('returns changed files with kinds and diffs', async () => {
        const diffs = await getAllFileDiffsFromRange({
          range: 'since-main',
          cwd: scene.repoPath,
        });
        const paths = diffs.map((d) => d.path);
        expect(paths).toContain('src/new-file.ts');
        expect(paths).toContain('src/valid.ts');

        // new file: changeKind new, diff present
        const newFile = diffs.find((d) => d.path === 'src/new-file.ts');
        expect(newFile?.changeKind).toEqual('new');
        expect(newFile?.diff).toContain('export const x = 1;');

        // edited file: changeKind edited, diff present with the added line
        const editedFile = diffs.find((d) => d.path === 'src/valid.ts');
        expect(editedFile?.changeKind).toEqual('edited');
        expect(editedFile?.diff).toContain('// modified');
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

        const diffs = await getAllFileDiffsFromRange({
          range: 'since-commit',
          cwd: scene.repoPath,
        });
        const paths = diffs.map((d) => d.path);
        expect(paths).toContain('src/valid.ts');
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

        const diffs = await getAllFileDiffsFromRange({
          range: 'since-commit',
          cwd: scene.repoPath,
        });
        const paths = diffs.map((d) => d.path);
        expect(paths).toContain('src/staged.ts');
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

        const diffs = await getAllFileDiffsFromRange({
          range: 'since-staged',
          cwd: scene.repoPath,
        });
        const paths = diffs.map((d) => d.path);
        expect(paths).toContain('src/staged-only.ts');
        expect(paths).not.toContain('src/valid.ts');
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
        const diffs = await getAllFileDiffsFromRange({
          range: 'since-commit',
          cwd: scene.repoPath,
        });
        expect(diffs).toEqual([]);
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
          const diffs = await getAllFileDiffsFromRange({
            range: 'since-main',
            cwd: scene.repoPath,
          });
          const paths = diffs.map((d) => d.path);

          // should include the feature branch file
          expect(paths).toContain('src/feature-file.ts');

          // should NOT include the other PR file that was merged to main
          // (this is the key assertion - merge-base excludes it)
          expect(paths).not.toContain('src/other-pr-file.ts');
        },
      );

      then('returns correct count of changed files', async () => {
        const diffs = await getAllFileDiffsFromRange({
          range: 'since-main',
          cwd: scene.repoPath,
        });

        // only 1 file changed on our branch
        expect(diffs).toHaveLength(1);
      });
    });
  });

  given('[case6] --diffs since-main includes untracked files', () => {
    const scene = usePrep(async () => {
      const { repoPath, cleanup } = setupTestRepo();

      // create a branch from main
      execSync('git checkout -b feature', { cwd: repoPath });

      // add a committed file
      fs.writeFileSync(
        path.join(repoPath, 'src/committed-file.ts'),
        'export const committed = true;',
      );
      execSync('git add .', { cwd: repoPath });
      execSync('git commit -m "committed file"', {
        cwd: repoPath,
        env: GIT_ENV,
      });

      // add an untracked file (not staged, not committed)
      fs.writeFileSync(
        path.join(repoPath, 'src/untracked-file.ts'),
        'export const untracked = true;',
      );

      // add a staged but not committed file
      fs.writeFileSync(
        path.join(repoPath, 'src/staged-file.ts'),
        'export const staged = true;',
      );
      execSync('git add src/staged-file.ts', { cwd: repoPath });

      return { repoPath, cleanup };
    });

    afterAll(() => scene.cleanup());

    when('[t0] untracked files exist on feature branch', () => {
      then('returns untracked files along with committed changes', async () => {
        const diffs = await getAllFileDiffsFromRange({
          range: 'since-main',
          cwd: scene.repoPath,
        });
        const paths = diffs.map((d) => d.path);

        // committed file should be included
        expect(paths).toContain('src/committed-file.ts');

        // untracked file should ALSO be included (critical for reviews)
        expect(paths).toContain('src/untracked-file.ts');

        // staged file should also be included
        expect(paths).toContain('src/staged-file.ts');

        // untracked file: changeKind new with a valid new-file diff
        const untracked = diffs.find((d) => d.path === 'src/untracked-file.ts');
        expect(untracked?.changeKind).toEqual('new');
        expect(untracked?.diff).toContain('export const untracked = true;');
        expect(untracked?.diff).toContain('/dev/null');
      });
    });
  });

  given(
    '[case7] --diffs since-main compares against origin/main not local main',
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
          const diffs = await getAllFileDiffsFromRange({
            range: 'since-main',
            cwd: scene.repoPath,
          });
          const paths = diffs.map((d) => d.path);

          // should include the feature branch file
          expect(paths).toContain('src/feature-file.ts');

          // should NOT include the file that was pushed to origin/main
          // (merge-base with origin/main excludes it)
          expect(paths).not.toContain('src/other-pr-on-origin.ts');

          // should NOT include the local-only file that exists only on local main
          // (we compare against origin/main, so local main divergence is ignored)
          expect(paths).not.toContain('src/local-only-file.ts');
        });

        then('returns only feature branch changes', async () => {
          const diffs = await getAllFileDiffsFromRange({
            range: 'since-main',
            cwd: scene.repoPath,
          });
          const paths = diffs.map((d) => d.path);

          // only 1 file: our feature branch change
          expect(paths).toHaveLength(1);
          expect(paths).toEqual(['src/feature-file.ts']);
        });
      });
    },
  );

  given('[case8] deleted file', () => {
    const scene = usePrep(async () => {
      const { repoPath, cleanup } = setupTestRepo();

      // create a feature branch and delete a tracked file
      execSync('git checkout -b feature', { cwd: repoPath });
      execSync('git rm src/valid.ts', { cwd: repoPath, env: GIT_ENV });
      execSync('git commit -m "delete valid.ts"', {
        cwd: repoPath,
        env: GIT_ENV,
      });

      return { repoPath, cleanup };
    });

    afterAll(() => scene.cleanup());

    when('[t0] a tracked file was removed', () => {
      then('file appears with changeKind deleted and diff null', async () => {
        const diffs = await getAllFileDiffsFromRange({
          range: 'since-main',
          cwd: scene.repoPath,
        });
        const paths = diffs.map((d) => d.path);

        // deleted file must still appear (not dropped)
        expect(paths).toContain('src/valid.ts');

        // deleted file carries a marker only: kind deleted, diff null
        const deleted = diffs.find((d) => d.path === 'src/valid.ts');
        expect(deleted?.changeKind).toEqual('deleted');
        expect(deleted?.diff).toBeNull();
      });
    });
  });
});
