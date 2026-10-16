import { execSync } from 'child_process';
import * as fs from 'fs';
import { BadRequestError } from 'helpful-errors';
import * as os from 'os';
import * as path from 'path';
import { getError, given, then, when } from 'test-fns';

import { getFsErrorCode } from '@src/utils/fs/getFsErrorCode';

import { getGitDiffStats } from './getGitDiffStats';

describe('getGitDiffStats', () => {
  given('[case1] a new file not tracked by git', () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'git-diff-test-'));
    const testFile = 'new-file.md';

    beforeAll(() => {
      // init git repo
      execSync('git init', { cwd: tempDir, stdio: 'pipe' });
      execSync('git config user.email "test@test.com"', {
        cwd: tempDir,
        stdio: 'pipe',
      });
      execSync('git config user.name "Test"', { cwd: tempDir, stdio: 'pipe' });

      // create untracked file
      fs.writeFileSync(
        path.join(tempDir, testFile),
        'line 1\nline 2\nline 3\n',
      );
    });

    afterAll(() => {
      fs.rmSync(tempDir, { recursive: true, force: true });
    });

    when('[t0] getGitDiffStats is called', () => {
      then('returns [+] symbol with line count', () => {
        const stats = getGitDiffStats({ file: testFile, cwd: tempDir });
        expect(stats.symbol).toEqual('[+]');
        expect(stats.lines).toEqual(4); // 3 lines + final newline
        expect(stats.added).toBeNull();
        expect(stats.removed).toBeNull();
      });
    });
  });

  given('[case2] a tracked file with modifications', () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'git-diff-test-'));
    const testFile = 'tracked.md';

    beforeAll(() => {
      // init git repo with initial commit
      execSync('git init', { cwd: tempDir, stdio: 'pipe' });
      execSync('git config user.email "test@test.com"', {
        cwd: tempDir,
        stdio: 'pipe',
      });
      execSync('git config user.name "Test"', { cwd: tempDir, stdio: 'pipe' });

      // create and commit file
      fs.writeFileSync(path.join(tempDir, testFile), 'original\n');
      execSync(`git add ${testFile}`, { cwd: tempDir, stdio: 'pipe' });
      execSync('git commit -m "initial"', { cwd: tempDir, stdio: 'pipe' });

      // modify file
      fs.writeFileSync(
        path.join(tempDir, testFile),
        'modified\nwith new line\n',
      );
    });

    afterAll(() => {
      fs.rmSync(tempDir, { recursive: true, force: true });
    });

    when('[t0] getGitDiffStats is called', () => {
      then('returns [~] symbol with diff stats', () => {
        const stats = getGitDiffStats({ file: testFile, cwd: tempDir });
        expect(stats.symbol).toEqual('[~]');
        expect(stats.lines).toEqual(3);
        expect(stats.added).toEqual(2); // numstat row `2\t1` for this fixture
        expect(stats.removed).toEqual(1);
      });
    });
  });

  given('[case3] a file that does not exist', () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'git-diff-test-'));

    beforeAll(() => {
      execSync('git init', { cwd: tempDir, stdio: 'pipe' });
    });

    afterAll(() => {
      fs.rmSync(tempDir, { recursive: true, force: true });
    });

    when('[t0] getGitDiffStats is called', () => {
      then('returns [-] symbol', () => {
        const stats = getGitDiffStats({ file: 'nonexistent.md', cwd: tempDir });
        expect(stats.symbol).toEqual('[-]');
        expect(stats.lines).toEqual(0);
      });
    });
  });

  given('[case4] a cwd that is not a git repo', () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'git-diff-test-'));
    const testFile = 'stray.md';
    const capDirsBefore = process.env.GIT_CEILING_DIRECTORIES;

    beforeAll(() => {
      // a plain dir, no git init; GIT_CEILING_DIRECTORIES (git's own env key) keeps
      // git from a climb into any repo above the os tmpdir
      fs.writeFileSync(path.join(tempDir, testFile), 'line 1\n');
      process.env.GIT_CEILING_DIRECTORIES = path.dirname(tempDir);
    });

    afterAll(() => {
      if (capDirsBefore === undefined)
        delete process.env.GIT_CEILING_DIRECTORIES;
      if (capDirsBefore !== undefined)
        process.env.GIT_CEILING_DIRECTORIES = capDirsBefore;
      fs.rmSync(tempDir, { recursive: true, force: true });
    });

    when('[t0] getGitDiffStats is called', () => {
      then('it throws the git fault rather than renders [+]', () => {
        const error = getError(() =>
          getGitDiffStats({ file: testFile, cwd: tempDir }),
        );
        expect(error.message).toContain('not a git repository');
      });
    });
  });

  given('[case5] a staged file in a repo with no commit yet', () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'git-diff-test-'));
    const testFile = 'staged.md';

    beforeAll(() => {
      execSync('git init', { cwd: tempDir, stdio: 'pipe' });
      fs.writeFileSync(path.join(tempDir, testFile), 'a\nb\n');
      execSync(`git add ${testFile}`, { cwd: tempDir, stdio: 'pipe' });
    });

    afterAll(() => {
      fs.rmSync(tempDir, { recursive: true, force: true });
    });

    when('[t0] getGitDiffStats is called', () => {
      then('it diffs against the index, since HEAD is absent', () => {
        const stats = getGitDiffStats({ file: testFile, cwd: tempDir });
        expect(stats).toEqual({
          lines: 3,
          added: 2,
          removed: 0,
          symbol: '[~]',
        });
      });
    });
  });

  given('[case6] a tracked binary file with modifications', () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'git-diff-test-'));
    const testFile = 'image.bin';

    beforeAll(() => {
      execSync('git init', { cwd: tempDir, stdio: 'pipe' });
      execSync('git config user.email "test@test.com"', {
        cwd: tempDir,
        stdio: 'pipe',
      });
      execSync('git config user.name "Test"', { cwd: tempDir, stdio: 'pipe' });

      // a nul byte marks the file binary to git, so numstat reads "-\t-\t"
      fs.writeFileSync(path.join(tempDir, testFile), Buffer.from([0, 1, 2]));
      execSync(`git add ${testFile}`, { cwd: tempDir, stdio: 'pipe' });
      execSync('git commit -m "initial"', { cwd: tempDir, stdio: 'pipe' });
      fs.writeFileSync(path.join(tempDir, testFile), Buffer.from([0, 3, 4]));
    });

    afterAll(() => {
      fs.rmSync(tempDir, { recursive: true, force: true });
    });

    when('[t0] getGitDiffStats is called', () => {
      // .note = only the numstat counts are withheld; `lines` is still the file's own
      //         newline split, which a binary body makes a count of bytes git never diffed
      then('🔴 it claims no added/removed counts, never a measured 0/0', () => {
        const stats = getGitDiffStats({ file: testFile, cwd: tempDir });
        expect(stats.symbol).toEqual('[~]');
        expect(stats.added).toBeNull();
        expect(stats.removed).toBeNull();
      });
    });
  });

  given('[case7] a repo whose index is corrupt', () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'git-diff-test-'));
    const testFile = 'tracked.md';

    beforeAll(() => {
      execSync('git init', { cwd: tempDir, stdio: 'pipe' });
      execSync('git config user.email "test@test.com"', {
        cwd: tempDir,
        stdio: 'pipe',
      });
      execSync('git config user.name "Test"', { cwd: tempDir, stdio: 'pipe' });
      fs.writeFileSync(path.join(tempDir, testFile), 'original\n');
      execSync(`git add ${testFile}`, { cwd: tempDir, stdio: 'pipe' });
      execSync('git commit -m "initial"', { cwd: tempDir, stdio: 'pipe' });

      // a corrupt index: git can no longer read which files it tracks
      fs.writeFileSync(path.join(tempDir, '.git/index'), 'garbage');
    });

    afterAll(() => {
      fs.rmSync(tempDir, { recursive: true, force: true });
    });

    when('[t0] getGitDiffStats is called', () => {
      then('it throws the git fault rather than renders [+]', () => {
        const error = getError(() =>
          getGitDiffStats({ file: testFile, cwd: tempDir }),
        );
        expect(error.message).toContain('index');
      });
    });
  });

  given(
    '[case8] a present file under a parent it cannot traverse (EACCES)',
    () => {
      // 🔴 the denial a bare catch would render as `[-]` deleted: the file exists, the
      //    parent's 0o000 bars the stat. the stat must rethrow it, never answer the sentinel
      const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'git-diff-test-'));
      const lockedDir = path.join(tempDir, 'locked');
      const testFile = 'locked/secret.md';

      beforeAll(() => {
        execSync('git init', { cwd: tempDir, stdio: 'pipe' });
        fs.mkdirSync(lockedDir, { recursive: true });
        fs.writeFileSync(path.join(tempDir, testFile), 'hidden\n');
        fs.chmodSync(lockedDir, 0o000);

        // fail fast where the runner bypasses file perms (root): the lock would not bite
        const bypassed = (() => {
          try {
            fs.readdirSync(lockedDir);
            return true;
          } catch {
            return false;
          }
        })();
        if (bypassed) {
          fs.chmodSync(lockedDir, 0o755);
          throw new BadRequestError('this runner reads a 0o000 dir', {
            hint: 'run the integration suite as a non-root user',
            uid: process.getuid?.() ?? null,
          });
        }
      });

      // restore the lock before the tree is removed, so no 0o000 dir is left behind
      afterAll(() => {
        fs.chmodSync(lockedDir, 0o755);
        fs.rmSync(tempDir, { recursive: true, force: true });
      });

      when('[t0] getGitDiffStats is called', () => {
        then('it rethrows the denial with its errno, never renders [-]', () => {
          const error = getError(() =>
            getGitDiffStats({ file: testFile, cwd: tempDir }),
          );
          expect(getFsErrorCode(error)).toEqual('EACCES');
        });
      });
    },
  );
});
