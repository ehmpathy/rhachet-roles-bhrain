import { execSync } from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { given, then, usePrep, useThen, when } from 'test-fns';

import { getAllFileChangesFromRange } from './getAllFileChangesFromRange';

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
 * .what = a fresh repo on `main` with three committed files, then a `feature` branch
 * .why = each range reads a different slice of one tree, so one tree serves them all
 */
const setupTestRepo = (): { repoPath: string; cleanup: () => void } => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'changes-from-range-'));
  const repoPath = path.join(tmpDir, 'repo');
  fs.mkdirSync(path.join(repoPath, 'src'), { recursive: true });
  fs.writeFileSync(path.join(repoPath, 'src/kept.ts'), 'export const a = 1;\n');
  fs.writeFileSync(path.join(repoPath, 'src/gone.ts'), 'export const b = 2;\n');
  fs.writeFileSync(
    path.join(repoPath, 'src/before.ts'),
    'export const renamed = "a body long enough for git to pair the rename";\n',
  );
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
 * .what = integration tests for the one selection behind both range readers
 * .why = every git call here is a real one against a real repo, so this suite clamps the
 *        shape of what the communicator parses out of git's own stdout: the base each
 *        range reads against, and the `{ path, changeKind, tracked }` of each entry
 *        (rule.require.external-contract-integration-tests)
 */
describe('getAllFileChangesFromRange', () => {
  given(
    '[case1] a branch with a commit, a rename, a staged file, an edit, and an untracked file',
    () => {
      const scene = usePrep(async () => {
        const { repoPath, cleanup } = setupTestRepo();

        // a committed new file, a committed delete, and a committed rename
        fs.writeFileSync(
          path.join(repoPath, 'src/added.ts'),
          'export const c = 3;\n',
        );
        execSync('git rm src/gone.ts', { cwd: repoPath });
        execSync('git mv src/before.ts src/after.ts', { cwd: repoPath });
        execSync('git add .', { cwd: repoPath });
        execSync('git commit -m "feature"', { cwd: repoPath, env: GIT_ENV });

        // a staged new file, an unstaged edit, and an untracked file
        fs.writeFileSync(
          path.join(repoPath, 'src/staged.ts'),
          'export const d = 4;\n',
        );
        execSync('git add src/staged.ts', { cwd: repoPath });
        fs.appendFileSync(path.join(repoPath, 'src/kept.ts'), '// edit\n');
        fs.writeFileSync(
          path.join(repoPath, 'src/loose.ts'),
          'export const e = 5;\n',
        );

        // the merge-base the since-main read must land on
        const mergeBase = execSync('git merge-base main HEAD', {
          cwd: repoPath,
          encoding: 'utf-8',
        }).trim();

        return { repoPath, cleanup, mergeBase };
      });

      afterAll(() => scene.cleanup());

      when('[t0] read over since-main', () => {
        const read = useThen('the read succeeds', async () =>
          getAllFileChangesFromRange({
            range: 'since-main',
            cwd: scene.repoPath,
          }),
        );

        then('the base is the merge-base sha, 40 hex chars', () => {
          expect(read.baseArgs).toMatch(/^[0-9a-f]{40}$/);
          expect(read.baseArgs).toEqual(scene.mergeBase);
        });

        then(
          'each entry carries its path, its kind, and which list named it, in path order',
          () => {
            expect(read.changes).toEqual([
              { path: 'src/added.ts', changeKind: 'new', tracked: true },
              { path: 'src/after.ts', changeKind: 'edited', tracked: true },
              { path: 'src/gone.ts', changeKind: 'deleted', tracked: true },
              { path: 'src/kept.ts', changeKind: 'edited', tracked: true },
              { path: 'src/loose.ts', changeKind: 'new', tracked: false },
              { path: 'src/staged.ts', changeKind: 'new', tracked: true },
            ]);
          },
        );

        then(
          '🔴 a rename is read under the path that exists now, never the old one',
          () => {
            const paths = read.changes.map((change) => change.path);
            expect(paths).toContain('src/after.ts');
            expect(paths).not.toContain('src/before.ts');
          },
        );
      });

      when('[t1] read over since-commit', () => {
        const read = useThen('the read succeeds', async () =>
          getAllFileChangesFromRange({
            range: 'since-commit',
            cwd: scene.repoPath,
          }),
        );

        then('the base is HEAD', () => {
          expect(read.baseArgs).toEqual('HEAD');
        });

        then(
          'it holds the uncommitted changes, untracked ones included',
          () => {
            expect(read.changes).toEqual([
              { path: 'src/kept.ts', changeKind: 'edited', tracked: true },
              { path: 'src/loose.ts', changeKind: 'new', tracked: false },
              { path: 'src/staged.ts', changeKind: 'new', tracked: true },
            ]);
          },
        );
      });

      when('[t2] read over since-staged', () => {
        const read = useThen('the read succeeds', async () =>
          getAllFileChangesFromRange({
            range: 'since-staged',
            cwd: scene.repoPath,
          }),
        );

        then('the base is the staged flag', () => {
          expect(read.baseArgs).toEqual('--staged');
        });

        then('🔴 it holds the index alone — no untracked file joins', () => {
          expect(read.changes).toEqual([
            { path: 'src/staged.ts', changeKind: 'new', tracked: true },
          ]);
        });
      });
    },
  );
});
