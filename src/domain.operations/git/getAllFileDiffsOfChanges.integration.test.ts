import { execSync } from 'child_process';
import * as fs from 'fs';
import { UnexpectedCodePathError } from 'helpful-errors';
import * as path from 'path';
import {
  genTempDir,
  getError,
  given,
  then,
  usePrep,
  useThen,
  when,
} from 'test-fns';

import { getAllFileDiffsOfChanges } from './getAllFileDiffsOfChanges';

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

/**
 * .what = a path whose bytes a double-quoted shell word would rewrite
 * .why = inside `"..."` the shell still expands `$name`, so `src/$wave.ts` became `src/.ts`
 *        and git read the patch of a path that does not exist (r010 nitpick.2, i013)
 */
const PATH_TRACKED = 'src/$wave.ts';
const PATH_UNTRACKED = 'src/$swell.ts';

/**
 * .note = this suite never copies the `example.repo` asset, so it needs none of the
 *         `git ls-files`-scoped copy `getAllFileDiffsFromRange.integration.test.ts`
 *         carries. that copy exists because peer suites write gitignored review logs
 *         INTO the asset; a fresh `genTempDir` repo with two hand-written files holds
 *         no such artifact to drag along
 */
describe('getAllFileDiffsOfChanges', () => {
  given('[case1] changed paths that carry a shell metacharacter', () => {
    const scene = usePrep(async () => {
      const repo = genTempDir({
        slug: 'diffs-of-changes-shell-path',
        git: true,
      });
      fs.mkdirSync(path.join(repo, 'src'), { recursive: true });
      fs.writeFileSync(path.join(repo, PATH_TRACKED), 'export const a = 1;\n');
      execSync('git add -A', { cwd: repo });
      execSync('git commit -m "initial"', { cwd: repo, env: GIT_ENV });
      fs.writeFileSync(path.join(repo, PATH_TRACKED), 'export const a = 2;\n');
      fs.writeFileSync(
        path.join(repo, PATH_UNTRACKED),
        'export const b = 3;\n',
      );
      return { repo };
    });

    when('[t0] each change is read for its patch', () => {
      const result = useThen('the read succeeds', async () => ({
        diffs: getAllFileDiffsOfChanges({
          changes: [
            { path: PATH_TRACKED, changeKind: 'edited', tracked: true },
            { path: PATH_UNTRACKED, changeKind: 'new', tracked: false },
          ],
          baseArgs: 'HEAD',
          cwd: scene.repo,
        }),
      }));

      then('the tracked patch is the patch of that literal path', () => {
        const diff = result.diffs[0]?.diff ?? '';
        expect(diff).toContain(`+++ b/${PATH_TRACKED}`);
        expect(diff).toContain('+export const a = 2;');
      });

      then('the untracked patch is the patch of that literal path', () => {
        const diff = result.diffs[1]?.diff ?? '';
        expect(diff).toContain(`+++ b/${PATH_UNTRACKED}`);
        expect(diff).toContain('+export const b = 3;');
      });
    });
  });

  given(
    '[case2] one change of each kind: edited, staged new, untracked new, deleted',
    () => {
      const scene = usePrep(async () => {
        const repo = genTempDir({ slug: 'diffs-of-changes-kinds', git: true });
        fs.mkdirSync(path.join(repo, 'src'), { recursive: true });
        fs.writeFileSync(
          path.join(repo, 'src/edit.ts'),
          'export const a = 1;\n',
        );
        fs.writeFileSync(
          path.join(repo, 'src/gone.ts'),
          'export const g = 0;\n',
        );
        execSync('git add -A', { cwd: repo });
        execSync('git commit -m "initial"', { cwd: repo, env: GIT_ENV });
        fs.writeFileSync(
          path.join(repo, 'src/edit.ts'),
          'export const a = 2;\n',
        );
        fs.writeFileSync(
          path.join(repo, 'src/fresh.ts'),
          'export const f = 1;\n',
        );
        execSync('git add src/fresh.ts', { cwd: repo });
        fs.writeFileSync(
          path.join(repo, 'src/loose.ts'),
          'export const l = 1;\n',
        );
        execSync('git rm -q src/gone.ts', { cwd: repo });
        return { repo };
      });

      when('[t0] each change is read for its patch against HEAD', () => {
        const result = useThen('the read succeeds', async () => ({
          diffs: getAllFileDiffsOfChanges({
            changes: [
              { path: 'src/edit.ts', changeKind: 'edited', tracked: true },
              { path: 'src/fresh.ts', changeKind: 'new', tracked: true },
              { path: 'src/loose.ts', changeKind: 'new', tracked: false },
              { path: 'src/gone.ts', changeKind: 'deleted', tracked: true },
            ],
            baseArgs: 'HEAD',
            cwd: scene.repo,
          }),
        }));

        then('the edit is a unified patch with both sides and a hunk', () => {
          const diff = result.diffs[0]?.diff ?? '';
          expect(diff).toContain('--- a/src/edit.ts');
          expect(diff).toContain('+++ b/src/edit.ts');
          expect(diff).toMatch(/^@@ -1 \+1 @@/m);
          expect(diff).toContain('-export const a = 1;');
          expect(diff).toContain('+export const a = 2;');
        });

        then('the staged new file is a new-file patch from /dev/null', () => {
          const diff = result.diffs[1]?.diff ?? '';
          expect(diff).toContain('new file mode');
          expect(diff).toContain('--- /dev/null');
          expect(diff).toContain('+++ b/src/fresh.ts');
        });

        then(
          'the untracked new file is a new-file patch from /dev/null',
          () => {
            const diff = result.diffs[2]?.diff ?? '';
            expect(diff).toContain('--- /dev/null');
            expect(diff).toContain('+++ b/src/loose.ts');
            expect(diff).toContain('+export const l = 1;');
          },
        );

        then(
          '🔴 the deleted file carries no patch at all — a marker only',
          () => {
            expect(result.diffs[3]).toEqual({
              path: 'src/gone.ts',
              changeKind: 'deleted',
              diff: null,
            });
          },
        );
      });
    },
  );

  given('[case3] patch reads that git cannot serve', () => {
    const scene = usePrep(async () => {
      const repo = genTempDir({ slug: 'diffs-of-changes-faults', git: true });
      fs.mkdirSync(path.join(repo, 'src'), { recursive: true });
      fs.writeFileSync(path.join(repo, 'src/edit.ts'), 'export const a = 1;\n');
      execSync('git add -A', { cwd: repo });
      execSync('git commit -m "initial"', { cwd: repo, env: GIT_ENV });
      return { repo };
    });

    // 🔴 the guard catches only the classes `getOneGitOutput` declares; a bare execSync
    //    error is a plain Error, which ends the whole guard pass on a stack trace
    when(
      '[t0] a tracked change is read against a base that does not exist',
      () => {
        then(
          'it throws the declared class, with the command and stderr',
          async () => {
            const error = await getError(async () =>
              getAllFileDiffsOfChanges({
                changes: [
                  { path: 'src/edit.ts', changeKind: 'edited', tracked: true },
                ],
                baseArgs: 'no-such-base-ref',
                cwd: scene.repo,
              }),
            );
            expect(error).toBeInstanceOf(UnexpectedCodePathError);
            expect(error.message).toContain('a git patch read failed');
            expect(error.message).toContain('no-such-base-ref');
          },
        );
      },
    );

    when('[t1] an untracked change is read from a cwd that is gone', () => {
      then(
        'it throws the declared class, never the raw execSync error',
        async () => {
          const error = await getError(async () =>
            getAllFileDiffsOfChanges({
              changes: [
                { path: 'src/edit.ts', changeKind: 'new', tracked: false },
              ],
              baseArgs: 'HEAD',
              cwd: path.join(scene.repo, 'no-such-dir'),
            }),
          );
          expect(error).toBeInstanceOf(UnexpectedCodePathError);
          expect(error.message).toContain('a git patch read failed');
        },
      );
    });
  });
});
