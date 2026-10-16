import { execSync } from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { given, then, usePrep, useThen, when } from 'test-fns';

import { getAllStoneGuardReviewTargetPaths } from './getAllStoneGuardReviewTargetPaths';
import { setStoneGuardReviewTargets } from './setStoneGuardReviewTargets';

/**
 * .what = git identity env for commits
 * .why = avoids the need for global git config on cicd machines
 */
const GIT_ENV = {
  ...process.env,
  GIT_AUTHOR_NAME: 'Test Human',
  GIT_AUTHOR_EMAIL: 'human@example.com',
  GIT_COMMITTER_NAME: 'Test Human',
  GIT_COMMITTER_EMAIL: 'human@example.com',
};

describe('setStoneGuardReviewTargets', () => {
  given(
    '[case1] a branch with an edit, a delete, and an untracked new file',
    () => {
      const scene = usePrep(async () => {
        // a repo whose main holds two files
        const tmpDir = fs.mkdtempSync(
          path.join(os.tmpdir(), 'review-targets-'),
        );
        const repoRoot = path.join(tmpDir, 'repo');
        fs.mkdirSync(path.join(repoRoot, 'src'), { recursive: true });
        fs.writeFileSync(
          path.join(repoRoot, 'src/kept.ts'),
          'export const a = 1;\n',
        );
        fs.writeFileSync(
          path.join(repoRoot, 'src/gone.ts'),
          'export const b = 1;\n',
        );
        execSync('git init', { cwd: repoRoot });
        execSync('git add .', { cwd: repoRoot });
        execSync('git commit -m "initial"', { cwd: repoRoot, env: GIT_ENV });
        execSync('git branch -M main', { cwd: repoRoot });

        // the branch edits one, deletes one, and leaves one new file untracked
        execSync('git checkout -b feature', { cwd: repoRoot });
        fs.appendFileSync(path.join(repoRoot, 'src/kept.ts'), '// edited\n');
        fs.rmSync(path.join(repoRoot, 'src/gone.ts'));
        execSync('git add .', { cwd: repoRoot });
        execSync('git commit -m "feature"', { cwd: repoRoot, env: GIT_ENV });
        fs.writeFileSync(
          path.join(repoRoot, 'src/fresh.ts'),
          'export const c = 1;\n',
        );

        // the list lands where the guard puts it, under the route's reviews dir
        const reviewsDir = path.join(
          repoRoot,
          '.behavior/v1.demo/.reviews/peer',
        );
        fs.mkdirSync(reviewsDir, { recursive: true });
        return { tmpDir, repoRoot, reviewsDir };
      });

      afterAll(() => fs.rmSync(scene.tmpDir, { recursive: true, force: true }));

      when('[t0] the targets are written', () => {
        const result = useThen('it succeeds', async () =>
          setStoneGuardReviewTargets({
            path: path.join(scene.reviewsDir, 'lane.targets.txt'),
            repoRoot: scene.repoRoot,
            targets: await getAllStoneGuardReviewTargetPaths({
              repoRoot: scene.repoRoot,
            }),
          }),
        );

        then(
          'the list holds the edited file AND the untracked new file',
          () => {
            // the untracked file is the clamp: a diff-only list omits it
            const lines = fs
              .readFileSync(path.join(scene.repoRoot, result.path), 'utf8')
              .split('\n')
              .filter((line) => line.length > 0);
            expect(lines).toEqual(['src/fresh.ts', 'src/kept.ts']);
          },
        );

        then('the deleted file is omitted', () => {
          expect(result.count).toEqual(2);
        });

        then('the returned path is repo-relative', () => {
          expect(result.path).toEqual(
            '.behavior/v1.demo/.reviews/peer/lane.targets.txt',
          );
        });
      });
    },
  );
});
