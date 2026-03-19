import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { given, then, useBeforeAll, when } from 'test-fns';

import { getReflectScope } from '../scope/getReflectScope';
import { getOneSavepoint } from './getOneSavepoint';
import { setSavepoint } from './setSavepoint';

describe('getOneSavepoint', () => {
  given('[case1] savepoint exists', () => {
    const tempDir = path.join(os.tmpdir(), `reflect-getone-${Date.now()}`);

    const scene = useBeforeAll(async () => {
      // create temp git repo
      fs.mkdirSync(tempDir, { recursive: true });
      const { execSync } = require('child_process');
      execSync('git init', { cwd: tempDir });
      execSync('git config user.email "test@test.com"', { cwd: tempDir });
      execSync('git config user.name "Test"', { cwd: tempDir });

      // create initial commit (required for HEAD to exist)
      fs.writeFileSync(path.join(tempDir, 'init.txt'), 'init');
      execSync('git add init.txt', { cwd: tempDir });
      execSync('git commit -m "initial"', { cwd: tempDir });

      // create a file for staged changes
      fs.writeFileSync(path.join(tempDir, 'test.txt'), 'content');
      execSync('git add test.txt', { cwd: tempDir });

      // create savepoint
      const scope = getReflectScope({ cwd: tempDir });
      const savepoint = setSavepoint({ scope, mode: 'apply' });

      return { scope, savepoint };
    });

    afterAll(() => {
      fs.rmSync(tempDir, { recursive: true, force: true });
    });

    when('[t0] savepoint is retrieved', () => {
      then('should return savepoint with correct timestamp', () => {
        const result = getOneSavepoint({
          scope: scene.scope,
          at: scene.savepoint.timestamp,
        });
        expect(result).not.toBeNull();
        expect(result?.timestamp).toEqual(scene.savepoint.timestamp);
      });

      then('should return savepoint with correct hash', () => {
        const result = getOneSavepoint({
          scope: scene.scope,
          at: scene.savepoint.timestamp,
        });
        expect(result?.hash).toEqual(scene.savepoint.hash);
      });

      then('should return savepoint with correct byte sizes', () => {
        const result = getOneSavepoint({
          scope: scene.scope,
          at: scene.savepoint.timestamp,
        });
        expect(result?.stagedPatchBytes).toEqual(
          scene.savepoint.stagedPatchBytes,
        );
        expect(result?.unstagedPatchBytes).toEqual(
          scene.savepoint.unstagedPatchBytes,
        );
      });
    });
  });

  given('[case2] savepoint does not exist', () => {
    when('[t0] retrieval is attempted', () => {
      then('should return null', () => {
        const scope = getReflectScope({ cwd: process.cwd() });
        const result = getOneSavepoint({
          scope,
          at: '9999-99-99.999999',
        });
        expect(result).toBeNull();
      });
    });
  });
});
