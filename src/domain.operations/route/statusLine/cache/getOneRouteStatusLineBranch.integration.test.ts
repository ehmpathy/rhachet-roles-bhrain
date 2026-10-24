import * as childProcess from 'child_process';
import * as path from 'path';
import { genTempDir, given, then, useBeforeAll, when } from 'test-fns';

import { getOneRouteStatusLineBranch } from './getOneRouteStatusLineBranch';

/**
 * .what = integration tests for the status line's branch read
 * .why = the cache is keyed by branch, and the hit path must learn it with no `git` spawn —
 *        a spawn costs more cpu than the whole cache hit. each checkout shape must give the
 *        same answer as `git rev-parse --abbrev-ref HEAD`, and only a shape the HEAD file
 *        cannot answer may spawn
 *
 * .note = `execSync` is spied, never mocked: the real call still runs, the spy only counts it
 * .note = the spy targets the real module object via `require`. an `import * as` namespace is
 *         an interop copy, so a spy on it never sees the source's call and counts zero always
 */
const childProcessModule: typeof childProcess = require('child_process');

/**
 * .what = the branch git itself names for a cwd
 * .why = the authority each case compares against
 */
const getBranchFromGit = (input: { cwd: string }): string =>
  childProcess
    .execSync('git rev-parse --abbrev-ref HEAD', { cwd: input.cwd })
    .toString()
    .trim();

/**
 * .what = reads the branch with `execSync` spied, and returns the branch and the spawn count
 * .why = names the measurement so each case reads as narrative
 */
const readBranchWithSpawnCount = (input: {
  cwd: string;
}): { branch: string; spawns: number } => {
  const spy = jest.spyOn(childProcessModule, 'execSync');
  try {
    const branch = getOneRouteStatusLineBranch({ cwd: input.cwd });
    return { branch, spawns: spy.mock.calls.length };
  } finally {
    spy.mockRestore();
  }
};

describe('getOneRouteStatusLineBranch.integration', () => {
  given('[case1] a plain checkout on a branch', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDir({
        slug: 'statusline-branch-case1',
        git: true,
      });
      childProcess.execSync('git checkout -q -b feat/plain', { cwd: tempDir });
      return { tempDir };
    });

    when('[t0] the branch is read', () => {
      then('it names the branch git names', () => {
        const out = readBranchWithSpawnCount({ cwd: scene.tempDir });
        expect(out.branch).toEqual('feat/plain');
        expect(out.branch).toEqual(getBranchFromGit({ cwd: scene.tempDir }));
      });

      then('CLAMP: it spawns no git', () => {
        expect(readBranchWithSpawnCount({ cwd: scene.tempDir }).spawns).toEqual(
          0,
        );
      });
    });
  });

  given(
    '[case2] a linked worktree, whose .git is a gitdir pointer file',
    () => {
      const scene = useBeforeAll(async () => {
        const tempDir = genTempDir({
          slug: 'statusline-branch-case2',
          git: true,
        });
        const worktreeDir = path.join(tempDir, '.worktrees', 'seat');
        childProcess.execSync(
          `git worktree add -q -b vlad/fix-status-line ${worktreeDir}`,
          { cwd: tempDir },
        );
        return { tempDir, worktreeDir };
      });

      when('[t0] the branch is read from the worktree', () => {
        then(
          "it names the worktree's own branch, not the main checkout's",
          () => {
            const out = readBranchWithSpawnCount({ cwd: scene.worktreeDir });
            expect(out.branch).toEqual('vlad/fix-status-line');
            expect(out.branch).toEqual(
              getBranchFromGit({ cwd: scene.worktreeDir }),
            );
            expect(out.branch).not.toEqual(
              getBranchFromGit({ cwd: scene.tempDir }),
            );
          },
        );

        then('CLAMP: it spawns no git', () => {
          expect(
            readBranchWithSpawnCount({ cwd: scene.worktreeDir }).spawns,
          ).toEqual(0);
        });
      });
    },
  );

  given('[case3] a detached HEAD', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDir({
        slug: 'statusline-branch-case3',
        git: true,
      });
      childProcess.execSync('git checkout -q --detach', { cwd: tempDir });
      return { tempDir };
    });

    when('[t0] the branch is read', () => {
      then('it falls back to git, and gives git its answer', () => {
        const out = readBranchWithSpawnCount({ cwd: scene.tempDir });
        expect(out.branch).toEqual('HEAD');
        expect(out.branch).toEqual(getBranchFromGit({ cwd: scene.tempDir }));
        expect(out.spawns).toEqual(1);
      });
    });
  });
});
