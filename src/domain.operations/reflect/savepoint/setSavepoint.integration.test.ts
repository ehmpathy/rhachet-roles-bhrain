import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { given, then, when } from 'test-fns';

import { getReflectScope } from '../scope/getReflectScope';
import { setSavepoint } from './setSavepoint';

describe('setSavepoint', () => {
  given('[case1] current repo in plan mode', () => {
    when('[t0] savepoint is captured', () => {
      const scope = getReflectScope({ cwd: process.cwd() });
      const savepoint = setSavepoint({ scope, mode: 'plan' });

      then('timestamp should be in expected format', () => {
        // format: YYYY-MM-DD.HHMMSS
        expect(savepoint.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}\.\d{6}$/);
      });

      then('commit.hash should be 40 chars', () => {
        expect(savepoint.commit.hash).toHaveLength(40);
      });

      then('patches.hash should be 7 chars', () => {
        expect(savepoint.patches.hash).toHaveLength(7);
      });

      then('paths should be under storagePath', () => {
        expect(savepoint.patches.stagedPath.startsWith(scope.storagePath)).toBe(
          true,
        );
        expect(
          savepoint.patches.unstagedPath.startsWith(scope.storagePath),
        ).toBe(true);
      });

      then('paths should have correct extensions', () => {
        expect(savepoint.patches.stagedPath.endsWith('.staged.patch')).toBe(
          true,
        );
        expect(savepoint.patches.unstagedPath.endsWith('.unstaged.patch')).toBe(
          true,
        );
      });

      then('bytes should be non-negative', () => {
        expect(savepoint.patches.stagedBytes).toBeGreaterThanOrEqual(0);
        expect(savepoint.patches.unstagedBytes).toBeGreaterThanOrEqual(0);
      });

      then('files should NOT be written in plan mode', () => {
        expect(fs.existsSync(savepoint.patches.stagedPath)).toBe(false);
        expect(fs.existsSync(savepoint.patches.unstagedPath)).toBe(false);
      });
    });
  });

  given('[case2] temp repo in apply mode', () => {
    const tempDir = path.join(os.tmpdir(), `reflect-test-${Date.now()}`);

    beforeAll(() => {
      // create temp git repo
      fs.mkdirSync(tempDir, { recursive: true });
      const { execSync } = require('child_process');
      execSync('git init', { cwd: tempDir });
      execSync('git config user.email "test@test.com"', { cwd: tempDir });
      execSync('git config user.name "Test"', { cwd: tempDir });

      // create initial commit so HEAD exists
      fs.writeFileSync(path.join(tempDir, 'init.txt'), 'init');
      execSync('git add init.txt', { cwd: tempDir });
      execSync('git commit -m "initial"', { cwd: tempDir });

      // create a file for unstaged changes (commit, then modify)
      fs.writeFileSync(path.join(tempDir, 'unstaged.txt'), 'v1');
      execSync('git add unstaged.txt', { cwd: tempDir });
      execSync('git commit -m "add unstaged.txt"', { cwd: tempDir });
      fs.writeFileSync(path.join(tempDir, 'unstaged.txt'), 'v2');

      // create a file for staged changes (after all commits)
      fs.writeFileSync(path.join(tempDir, 'staged.txt'), 'staged content');
      execSync('git add staged.txt', { cwd: tempDir });
    });

    afterAll(() => {
      fs.rmSync(tempDir, { recursive: true, force: true });
    });

    when('[t0] savepoint is applied', () => {
      let scope: ReturnType<typeof getReflectScope>;
      let savepoint: ReturnType<typeof setSavepoint>;

      beforeAll(() => {
        scope = getReflectScope({ cwd: tempDir });
        savepoint = setSavepoint({ scope, mode: 'apply' });
      });

      afterAll(() => {
        // cleanup savepoint files
        if (fs.existsSync(savepoint.patches.stagedPath)) {
          fs.rmSync(savepoint.patches.stagedPath);
        }
        if (fs.existsSync(savepoint.patches.unstagedPath)) {
          fs.rmSync(savepoint.patches.unstagedPath);
        }
        const commitPath = savepoint.patches.stagedPath.replace(
          '.staged.patch',
          '.commit',
        );
        if (fs.existsSync(commitPath)) {
          fs.rmSync(commitPath);
        }
      });

      then('commit.hash should be valid git hash', () => {
        expect(savepoint.commit.hash).toMatch(/^[a-f0-9]{40}$/);
      });

      then('staged.patch should be written', () => {
        expect(fs.existsSync(savepoint.patches.stagedPath)).toBe(true);
      });

      then('unstaged.patch should be written', () => {
        expect(fs.existsSync(savepoint.patches.unstagedPath)).toBe(true);
      });

      then('.commit file should be written', () => {
        const commitPath = savepoint.patches.stagedPath.replace(
          '.staged.patch',
          '.commit',
        );
        expect(fs.existsSync(commitPath)).toBe(true);
        const content = fs.readFileSync(commitPath, 'utf-8');
        expect(content).toEqual(savepoint.commit.hash);
      });

      then('staged.patch should contain staged diff', () => {
        const content = fs.readFileSync(savepoint.patches.stagedPath, 'utf-8');
        expect(content).toContain('staged content');
      });

      then('unstaged.patch should contain unstaged diff', () => {
        const content = fs.readFileSync(
          savepoint.patches.unstagedPath,
          'utf-8',
        );
        expect(content).toContain('v2');
      });
    });
  });
});
