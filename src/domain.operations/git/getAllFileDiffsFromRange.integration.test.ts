import { execSync } from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { getError, given, then, usePrep, useThen, when } from 'test-fns';

import { getAllFileDiffsFromRange } from './getAllFileDiffsFromRange';
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
 * .what = the example.repo asset, as committed
 */
const ASSET_PATH = 'src/domain.operations/review/.test/assets/example.repo';

/**
 * .what = copies the example.repo fixture into a fresh directory
 * .why = the fixture is what git TRACKS, never whatever sits on disk.
 *        peer suites run real reviews with this asset as their cwd, so they
 *        write unbounded gitignored artifacts (`.log/bhrain/review/`) into
 *        it. a wholesale copy drags those in, `git add .` stages thousands of
 *        files, and `git commit` overflows the 1mb spawnSync pipe (ENOBUFS).
 */
const copyAssetFixture = (input: { into: string }): void => {
  const assetFiles = execSync(`git ls-files -z -- ${ASSET_PATH}`, {
    encoding: 'utf8',
  })
    .split('\0')
    .filter((each) => each.length > 0);

  for (const assetFile of assetFiles) {
    const destination = path.join(
      input.into,
      path.relative(ASSET_PATH, assetFile),
    );
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.copyFileSync(assetFile, destination);
  }
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
  copyAssetFixture({ into: repoPath });

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
      const read = useThen('the range is read', async () => ({
        diffs: await getAllFileDiffsFromRange({
          range: 'since-main',
          cwd: scene.repoPath,
        }),
      }));

      then('returns only feature branch changes, not main changes', () => {
        const paths = read.diffs.map((d) => d.path);

        // should include the feature branch file
        expect(paths).toContain('src/feature-file.ts');

        // should NOT include the other PR file that was merged to main
        // (this is the key assertion - merge-base excludes it)
        expect(paths).not.toContain('src/other-pr-file.ts');
      });

      then('returns correct count of changed files', () => {
        // only 1 file changed on our branch
        expect(read.diffs).toHaveLength(1);
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
        copyAssetFixture({ into: repoPath });
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
        const read = useThen('the range is read', async () => ({
          diffs: await getAllFileDiffsFromRange({
            range: 'since-main',
            cwd: scene.repoPath,
          }),
        }));

        then('compares against origin/main, not local main', () => {
          const paths = read.diffs.map((d) => d.path);

          // should include the feature branch file
          expect(paths).toContain('src/feature-file.ts');

          // should NOT include the file that was pushed to origin/main
          // (merge-base with origin/main excludes it)
          expect(paths).not.toContain('src/other-pr-on-origin.ts');

          // should NOT include the local-only file that exists only on local main
          // (we compare against origin/main, so local main divergence is ignored)
          expect(paths).not.toContain('src/local-only-file.ts');
        });

        then('returns only feature branch changes', () => {
          const paths = read.diffs.map((d) => d.path);

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

  given('[case9] --diffs since-main from a cwd outside any git repo', () => {
    // .note = git exits 128 here, the same status as for an absent ref. a ref check
    //         that read every failure as "absent" would refuse with the false fix
    //         "create an initial commit on main" — so this clamps that it does not
    const scene = usePrep(async () => {
      const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'review-norepo-'));
      return {
        tmpDir,
        cleanup: () => fs.rmSync(tmpDir, { recursive: true, force: true }),
      };
    });

    afterAll(() => scene.cleanup());

    when('[t0] the main branch ref is checked', () => {
      then(
        'it fails loud with the ref and git stderr, never as absent',
        async () => {
          const error = await getError(
            getAllFileDiffsFromRange({
              range: 'since-main',
              cwd: scene.tmpDir,
            }),
          );
          expect(error.message).toContain(
            'could not check whether a git ref exists',
          );
          expect(error.message).toContain('not a git repository');
          expect(error.message).not.toContain(
            'create an initial commit on main',
          );
        },
      );
    });
  });

  given('[case10] an untracked symlink that points at a directory', () => {
    const scene = usePrep(async () => {
      const { repoPath, cleanup } = setupTestRepo();
      execSync('git checkout -b feature', { cwd: repoPath });

      // 🔴 the shape `rhachet roles link` leaves: `.claude` is a symlink to a
      //    directory. git lists it as ONE untracked entry, so the review read it
      //    as a file and halted on EISDIR
      fs.mkdirSync(path.join(repoPath, '.agent-dir'), { recursive: true });
      fs.symlinkSync('.agent-dir', path.join(repoPath, '.claude'));

      // a broken link has no body either
      fs.symlinkSync('absent-target', path.join(repoPath, 'broken-link'));

      // and a real untracked file, which must survive the filter
      fs.writeFileSync(
        path.join(repoPath, 'src/untracked-file.ts'),
        'export const untracked = true;',
      );

      return { repoPath, cleanup };
    });

    afterAll(() => scene.cleanup());

    when('[t0] since-main enumerates the untracked set', () => {
      then('🔴 the link to a directory is never a target', async () => {
        const diffs = await getAllFileDiffsFromRange({
          range: 'since-main',
          cwd: scene.repoPath,
        });
        const paths = diffs.map((d) => d.path);
        expect(paths).not.toContain('.claude');
        expect(paths).not.toContain('broken-link');
        expect(paths).toContain('src/untracked-file.ts');
      });
    });
  });

  given('[case11] a STAGED symlink that points at a directory', () => {
    const scene = usePrep(async () => {
      const { repoPath, cleanup } = setupTestRepo();
      execSync('git checkout -b feature', { cwd: repoPath });

      // 🔴 `git add .` stages the link, so it arrives through the TRACKED diff
      //    rather than the untracked list — the shape a real acceptance run met
      fs.mkdirSync(path.join(repoPath, '.agent-dir'), { recursive: true });
      fs.writeFileSync(path.join(repoPath, '.agent-dir/keep.md'), '# keep');
      fs.symlinkSync('.agent-dir', path.join(repoPath, '.claude'));
      fs.writeFileSync(
        path.join(repoPath, 'src/staged-file.ts'),
        'export const staged = true;',
      );
      execSync('git add .', { cwd: repoPath });

      return { repoPath, cleanup };
    });

    afterAll(() => scene.cleanup());

    when('[t0] since-main enumerates the staged set', () => {
      then('🔴 the staged link is never a target', async () => {
        const diffs = await getAllFileDiffsFromRange({
          range: 'since-main',
          cwd: scene.repoPath,
        });
        const paths = diffs.map((d) => d.path);
        expect(paths).not.toContain('.claude');
        expect(paths).toContain('src/staged-file.ts');
        expect(paths).toContain('.agent-dir/keep.md');
      });
    });
  });

  given(
    '[case12] a branch with an edit, a new file, a delete, an untracked file, and a link to a dir',
    () => {
      // 🔴 the parity clamp: `getAllFilePathsFromRange` serves the guard's `$targets`
      //    without a patch read, so it must select exactly what the diff read selects,
      //    less the deleted entries — or a lane reads a list `rhx review` would not
      const scene = usePrep(async () => {
        const { repoPath, cleanup } = setupTestRepo();
        execSync('git checkout -b feature', { cwd: repoPath });
        fs.appendFileSync(path.join(repoPath, 'src/valid.ts'), '\n// edit');
        fs.writeFileSync(path.join(repoPath, 'src/added.ts'), 'export {};');
        execSync('git add .', { cwd: repoPath });
        execSync('git commit -m "edit + add"', { cwd: repoPath, env: GIT_ENV });
        execSync('git rm -q src/added.ts', { cwd: repoPath });
        fs.writeFileSync(path.join(repoPath, 'src/loose.ts'), 'export {};');
        fs.mkdirSync(path.join(repoPath, '.agent-dir'), { recursive: true });
        fs.symlinkSync('.agent-dir', path.join(repoPath, '.claude'));
        return { repoPath, cleanup };
      });

      afterAll(() => scene.cleanup());

      when('[t0] both reads run over since-main', () => {
        then(
          'the paths read equals the diff read, less its deleted entries',
          async () => {
            const diffs = await getAllFileDiffsFromRange({
              range: 'since-main',
              cwd: scene.repoPath,
            });
            const paths = await getAllFilePathsFromRange({
              range: 'since-main',
              cwd: scene.repoPath,
            });
            expect(paths).toEqual(
              diffs
                .filter((diff) => diff.changeKind !== 'deleted')
                .map((diff) => diff.path),
            );
            expect(paths).toContain('src/valid.ts');
            expect(paths).toContain('src/loose.ts');
            expect(paths).not.toContain('.claude');
          },
        );
      });
    },
  );

  given(
    '[case13] a tracked file removed from the index alone — git rm --cached',
    () => {
      // 🔴 the drift clamp: the file is deleted in the index and still sits on disk as
      //    an untracked twin. the tracked entry wins in both readers, so the diff read
      //    names it once, as deleted, and the paths read leaves it out
      const scene = usePrep(async () => {
        const { repoPath, cleanup } = setupTestRepo();
        execSync('git checkout -b feature', { cwd: repoPath });
        execSync('git rm -q --cached src/valid.ts', { cwd: repoPath });
        return { repoPath, cleanup };
      });

      afterAll(() => scene.cleanup());

      when('[t0] both reads run over since-main', () => {
        then('the diff read names it once, as deleted', async () => {
          const diffs = await getAllFileDiffsFromRange({
            range: 'since-main',
            cwd: scene.repoPath,
          });
          const entries = diffs.filter((diff) => diff.path === 'src/valid.ts');
          expect(entries).toEqual([
            { path: 'src/valid.ts', changeKind: 'deleted', diff: null },
          ]);
        });

        then('the paths read leaves it out', async () => {
          const paths = await getAllFilePathsFromRange({
            range: 'since-main',
            cwd: scene.repoPath,
          });
          expect(paths).not.toContain('src/valid.ts');
        });
      });
    },
  );

  // .note = clamp: each patch was read through node's default 1 MiB pipe, so a new or edited
  //         file of 1 MiB or more threw `spawnSync /bin/sh ENOBUFS` — every partition of a
  //         lane once failed so, on a 1.7 MB prompt a peer partition had just written. a
  //         patch's size is the overflow gate's to judge, never a pipe buffer's
  given(
    '[case14] a new file and an edited file, each past the 1 MiB pipe default',
    () => {
      const MASS =
        'a line of mass that fills the patch past one mebibyte\n'.repeat(
          40_000,
        ); // ~2.2 MB
      const scene = usePrep(async () => {
        const { repoPath, cleanup } = setupTestRepo();
        execSync('git checkout -b feature', { cwd: repoPath });
        fs.writeFileSync(path.join(repoPath, 'src/large-new.md'), MASS);
        fs.appendFileSync(
          path.join(repoPath, 'src/valid.ts'),
          `\n/*\n${MASS}*/\n`,
        );
        return { repoPath, cleanup };
      });

      afterAll(() => scene.cleanup());

      when('[t0] the diffs are read over since-main', () => {
        const result = useThen('the read succeeds', async () => ({
          diffs: await getAllFileDiffsFromRange({
            range: 'since-main',
            cwd: scene.repoPath,
          }),
        }));

        then('the untracked new file carries its whole patch', () => {
          const newFile = result.diffs.find(
            (d) => d.path === 'src/large-new.md',
          );
          expect(newFile?.changeKind).toEqual('new');
          expect(newFile?.diff?.length).toBeGreaterThan(MASS.length);
        });

        then('the tracked edited file carries its whole patch', () => {
          const edited = result.diffs.find((d) => d.path === 'src/valid.ts');
          expect(edited?.changeKind).toEqual('edited');
          expect(edited?.diff?.length).toBeGreaterThan(MASS.length);
        });
      });
    },
  );

  given(
    '[case15] 🔴 paths that carry a shell metacharacter, read over since-main',
    () => {
      // the clamp `getAllFileDiffsOfChanges.integration.test.ts` holds one layer down,
      // proven here at the grain a guard lane calls: a double-quoted `$wave` expands
      // to an empty name, so the read would carry some other path's patch, or none
      const scene = usePrep(async () => {
        const { repoPath, cleanup } = setupTestRepo();
        execSync('git checkout -b feature', { cwd: repoPath });
        fs.writeFileSync(
          path.join(repoPath, 'src/$wave.ts'),
          'export const wave = 1;\n',
        );
        execSync('git add .', { cwd: repoPath });
        execSync('git commit -m "a tracked metacharacter path"', {
          cwd: repoPath,
          env: GIT_ENV,
        });
        fs.writeFileSync(
          path.join(repoPath, 'src/$swell.ts'),
          'export const swell = 2;\n',
        );
        return { repoPath, cleanup };
      });

      afterAll(() => scene.cleanup());

      when('[t0] the diffs are read over since-main', () => {
        const result = useThen('the read succeeds', async () => ({
          diffs: await getAllFileDiffsFromRange({
            range: 'since-main',
            cwd: scene.repoPath,
          }),
        }));

        then('the committed path carries its own patch', () => {
          const wave = result.diffs.find((d) => d.path === 'src/$wave.ts');
          expect(wave?.changeKind).toEqual('new');
          expect(wave?.diff).toContain('export const wave = 1;');
        });

        then('the untracked path carries its own patch', () => {
          const swell = result.diffs.find((d) => d.path === 'src/$swell.ts');
          expect(swell?.changeKind).toEqual('new');
          expect(swell?.diff).toContain('export const swell = 2;');
        });
      });
    },
  );

  given('[case16] 🔴 a healthy repo with no main and no master', () => {
    // the absent-ref half of the allowlist `[case9]` clamps from the other side:
    // git's own answer for an absent revision must read as ABSENT, so the caller
    // sees the constraint and its fix, never an unexpected-path malfunction
    const scene = usePrep(async () => {
      const { repoPath, cleanup } = setupTestRepo();
      execSync('git branch -M trunk', { cwd: repoPath });
      return { repoPath, cleanup };
    });

    afterAll(() => scene.cleanup());

    when('[t0] the diffs are read over since-main', () => {
      then('it refuses with the constraint that names the fix', async () => {
        const error = await getError(
          getAllFileDiffsFromRange({
            range: 'since-main',
            cwd: scene.repoPath,
          }),
        );
        expect(error.message).toContain(
          'since-main requires a main or master branch to exist',
        );
        expect(error.message).not.toContain(
          'could not check whether a git ref exists',
        );
      });
    });
  });

  given('[case17] 🔴 a repo whose .git/HEAD is corrupt', () => {
    // a corrupt repo is a malfunction, never an absent ref: the fix "create main" would
    // be false, so the read must fail loud with git's own stderr
    const scene = usePrep(async () => {
      const { repoPath, cleanup } = setupTestRepo();
      fs.writeFileSync(path.join(repoPath, '.git/HEAD'), 'garbage\n');
      return { repoPath, cleanup };
    });

    afterAll(() => scene.cleanup());

    when('[t0] the diffs are read over since-main', () => {
      then('it fails loud, never as the absent-main constraint', async () => {
        const error = await getError(
          getAllFileDiffsFromRange({
            range: 'since-main',
            cwd: scene.repoPath,
          }),
        );
        expect(error.message).toContain(
          'could not check whether a git ref exists',
        );
        expect(error.message).not.toContain(
          'since-main requires a main or master branch to exist',
        );
      });
    });
  });
});
