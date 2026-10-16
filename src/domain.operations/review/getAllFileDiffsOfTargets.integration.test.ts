import { execSync } from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { given, then, usePrep, useThen, when } from 'test-fns';

import { getAllFileChangesForReview } from './getAllFileChangesForReview';
import { getAllFileDiffsOfTargets } from './getAllFileDiffsOfTargets';

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
 * .what = a temp repo with one commit on main and a feature branch checked out
 */
const genRepoOnBranch = (): { repoPath: string; cleanup: () => void } => {
  const tmpDir = fs.mkdtempSync(
    path.join(os.tmpdir(), 'review-diffs-of-targets-'),
  );
  fs.mkdirSync(path.join(tmpDir, 'src'), { recursive: true });
  fs.writeFileSync(
    path.join(tmpDir, 'src/seed.ts'),
    'export const seed = 0;\n',
  );
  execSync('git init -q', { cwd: tmpDir });
  execSync('git add .', { cwd: tmpDir });
  execSync('git commit -q -m "seed"', { cwd: tmpDir, env: GIT_ENV });
  execSync('git branch -M main', { cwd: tmpDir });
  execSync('git checkout -q -b feature', { cwd: tmpDir });
  return {
    repoPath: tmpDir,
    cleanup: () => fs.rmSync(tmpDir, { recursive: true, force: true }),
  };
};

describe('getAllFileDiffsOfTargets', () => {
  // .note = clamp: every patch the range held was once read BEFORE the scope walk, so a
  //         review's own run log (`.log/bhrain/review/**/input.prompt.md`, which the
  //         polluter filter drops a step later) was diffed whole — and a 1.7 MB prompt a
  //         peer partition had just written broke every partition of a lane on ENOBUFS.
  //         the non-target here is past the 64 MiB bound one patch may hold, so an eager
  //         read throws, and a read bounded by the targets never touches it
  given(
    '[case1] a small target beside a non-target too large for any one patch read',
    () => {
      const scene = usePrep(async () => {
        const { repoPath, cleanup } = genRepoOnBranch();
        fs.writeFileSync(
          path.join(repoPath, 'src/target.ts'),
          'export const target = 1;\n',
        );
        fs.mkdirSync(path.join(repoPath, '.log/bhrain/review/run'), {
          recursive: true,
        });
        fs.writeFileSync(
          path.join(repoPath, '.log/bhrain/review/run/input.prompt.md'),
          Buffer.alloc(48 * 1024 * 1024, 'a\n'), // a patch of ~72 MiB
        );
        return { repoPath, cleanup };
      });

      afterAll(() => scene.cleanup());

      when('[t0] the patches are read for the target alone', () => {
        const result = useThen('the read succeeds', async () => {
          const selection = getAllFileChangesForReview({
            diffs: 'since-main',
            cwd: scene.repoPath,
          });
          return {
            selection,
            diffs: getAllFileDiffsOfTargets({
              selection,
              targets: ['src/target.ts'],
              cwd: scene.repoPath,
            }),
          };
        });

        then('the selection still names the non-target, by path', () => {
          expect(
            result.selection.changes.map((change) => change.path),
          ).toContain('.log/bhrain/review/run/input.prompt.md');
        });

        then('only the target carries a patch', () => {
          expect(result.diffs.map((diff) => diff.path)).toEqual([
            'src/target.ts',
          ]);
          expect(result.diffs[0]?.diff).toContain('export const target = 1;');
        });
      });
    },
  );

  given('[case2] no range asked', () => {
    when('[t0] the patches are read', () => {
      then('there is no base, and no patch', () => {
        const selection = getAllFileChangesForReview({
          diffs: undefined,
          cwd: os.tmpdir(),
        });
        expect(selection).toEqual({ baseArgs: null, changes: [] });
        expect(
          getAllFileDiffsOfTargets({
            selection,
            targets: ['src/any.ts'],
            cwd: os.tmpdir(),
          }),
        ).toEqual([]);
      });
    });
  });
});
