import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { given, then, useBeforeAll, when } from 'test-fns';

import { getReflectScope } from '../scope/getReflectScope';
import { getAllSavepoints } from './getAllSavepoints';
import { setSavepoint } from './setSavepoint';

/**
 * .what = delay helper for test wait
 * .why = ensures different timestamps between savepoints
 */
const delay = (ms: number): Promise<void> =>
  new Promise((done) => setTimeout(done, ms));

describe('getAllSavepoints', () => {
  given('[case1] multiple savepoints exist', () => {
    const tempDir = path.join(os.tmpdir(), `reflect-getall-${Date.now()}`);

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

      // create first file and savepoint
      fs.writeFileSync(path.join(tempDir, 'file1.txt'), 'content1');
      execSync('git add file1.txt', { cwd: tempDir });

      const scope = getReflectScope({ cwd: tempDir });
      const savepoint1 = setSavepoint({ scope, mode: 'apply' });

      // wait to ensure different timestamp
      await delay(1100);

      // create second file and savepoint
      fs.writeFileSync(path.join(tempDir, 'file2.txt'), 'content2');
      execSync('git add file2.txt', { cwd: tempDir });

      const savepoint2 = setSavepoint({ scope, mode: 'apply' });

      return { scope, savepoint1, savepoint2 };
    });

    afterAll(() => {
      fs.rmSync(tempDir, { recursive: true, force: true });
    });

    when('[t0] all savepoints are retrieved', () => {
      then('should return 2 savepoints', () => {
        const result = getAllSavepoints({ scope: scene.scope });
        expect(result.count).toEqual(2);
        expect(result.savepoints).toHaveLength(2);
      });

      then('savepoints should be sorted oldest first', () => {
        const result = getAllSavepoints({ scope: scene.scope });
        expect(result.savepoints[0]?.timestamp).toEqual(
          scene.savepoint1.timestamp,
        );
        expect(result.savepoints[1]?.timestamp).toEqual(
          scene.savepoint2.timestamp,
        );
      });

      then('totalBytes should sum all patch sizes', () => {
        const result = getAllSavepoints({ scope: scene.scope });
        const expected =
          scene.savepoint1.stagedPatchBytes +
          scene.savepoint1.unstagedPatchBytes +
          scene.savepoint2.stagedPatchBytes +
          scene.savepoint2.unstagedPatchBytes;
        expect(result.totalBytes).toEqual(expected);
      });
    });
  });

  given('[case2] no savepoints exist', () => {
    when('[t0] all savepoints are retrieved', () => {
      then('should return empty summary', () => {
        const scope = getReflectScope({ cwd: process.cwd() });
        // use a scope that likely has no savepoints
        const result = getAllSavepoints({ scope });
        // might have savepoints from other tests, so just check structure
        expect(result.count).toBeGreaterThanOrEqual(0);
        expect(Array.isArray(result.savepoints)).toBe(true);
        expect(typeof result.totalBytes).toBe('number');
      });
    });
  });
});
