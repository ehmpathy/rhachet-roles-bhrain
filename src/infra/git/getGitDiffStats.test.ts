import { execSync } from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { given, then, when } from 'test-fns';

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
        expect(stats.added).toBeGreaterThanOrEqual(0);
        expect(stats.removed).toBeGreaterThanOrEqual(0);
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
});
