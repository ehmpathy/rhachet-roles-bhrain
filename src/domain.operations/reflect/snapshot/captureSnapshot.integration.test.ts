import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { getError, given, then, useBeforeAll, when } from 'test-fns';

import { setAnnotation } from '../annotation/setAnnotation';
import { setSavepoint } from '../savepoint/setSavepoint';
import { getReflectScope } from '../scope/getReflectScope';
import { captureSnapshot } from './captureSnapshot';

/**
 * .what = creates a mock claude code project for tests
 * .why = captureSnapshot requires transcript source to exist
 */
const setupMockClaudeProject = (input: { cwd: string }): string => {
  // compute project slug (same as getTranscriptSource)
  const slug = input.cwd.replace(/\//g, '-');
  const projectDir = path.join(os.homedir(), '.claude', 'projects', slug);
  fs.mkdirSync(projectDir, { recursive: true });

  // create mock transcript file
  const transcriptPath = path.join(projectDir, 'test-transcript.jsonl');
  const mockMessages = [
    { type: 'user', timestamp: '2026-03-16T12:00:00.000Z', message: 'hello' },
    {
      type: 'assistant',
      timestamp: '2026-03-16T12:00:01.000Z',
      message: 'hi there',
    },
  ];
  fs.writeFileSync(
    transcriptPath,
    mockMessages.map((m) => JSON.stringify(m)).join('\n'),
  );

  return projectDir;
};

describe('captureSnapshot', () => {
  given('[case1] valid repo with transcript', () => {
    const tempDir = path.join(os.tmpdir(), `reflect-capture-${Date.now()}`);
    let mockProjectDir: string;

    const scene = useBeforeAll(async () => {
      // create temp git repo
      fs.mkdirSync(tempDir, { recursive: true });
      const { execSync } = require('child_process');
      execSync('git init', { cwd: tempDir });
      execSync('git config user.email "test@test.com"', { cwd: tempDir });
      execSync('git config user.name "Test"', { cwd: tempDir });

      // create initial commit
      fs.writeFileSync(path.join(tempDir, 'init.txt'), 'init');
      execSync('git add init.txt', { cwd: tempDir });
      execSync('git commit -m "initial"', { cwd: tempDir });

      // setup mock claude project
      mockProjectDir = setupMockClaudeProject({ cwd: tempDir });

      // get scope
      const scope = getReflectScope({ cwd: tempDir });

      // create a savepoint
      fs.writeFileSync(path.join(tempDir, 'file.txt'), 'content');
      execSync('git add file.txt', { cwd: tempDir });
      const savepoint = setSavepoint({ scope, mode: 'apply' });

      // create an annotation
      const annotation = setAnnotation({
        scope,
        text: 'test annotation for snapshot',
      });

      // capture snapshot
      const snapshot = await captureSnapshot({ scope });

      return { scope, savepoint, annotation, snapshot };
    });

    afterAll(() => {
      fs.rmSync(tempDir, { recursive: true, force: true });
      if (mockProjectDir && fs.existsSync(mockProjectDir)) {
        fs.rmSync(mockProjectDir, { recursive: true, force: true });
      }
    });

    when('[t0] snapshot is captured', () => {
      then('timestamp should be in expected format', () => {
        expect(scene.snapshot.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}\.\d{6}$/);
      });

      then('snapshot file should exist', () => {
        expect(fs.existsSync(scene.snapshot.path)).toBe(true);
      });

      then('snapshot path should end with .snap.zip', () => {
        expect(scene.snapshot.path.endsWith('.snap.zip')).toBe(true);
      });

      then('snapshot path should include date directory', () => {
        expect(scene.snapshot.path).toContain('/date=');
      });

      then('metadata should include transcript info', () => {
        expect(scene.snapshot.metadata.transcript.sessionCount).toBeGreaterThan(
          0,
        );
        expect(scene.snapshot.metadata.transcript.fileCount).toBeGreaterThan(0);
      });

      then('metadata should include savepoint count', () => {
        expect(scene.snapshot.metadata.savepoints.count).toBeGreaterThanOrEqual(
          1,
        );
      });

      then('metadata should include annotation count', () => {
        expect(
          scene.snapshot.metadata.annotations.count,
        ).toBeGreaterThanOrEqual(1);
      });
    });
  });

  given('[case2] repo without claude project', () => {
    const tempDir = path.join(
      os.tmpdir(),
      `reflect-capture-noproj-${Date.now()}`,
    );

    beforeAll(() => {
      // create temp git repo without claude project
      fs.mkdirSync(tempDir, { recursive: true });
      const { execSync } = require('child_process');
      execSync('git init', { cwd: tempDir });
      execSync('git config user.email "test@test.com"', { cwd: tempDir });
      execSync('git config user.name "Test"', { cwd: tempDir });
      fs.writeFileSync(path.join(tempDir, 'init.txt'), 'init');
      execSync('git add init.txt', { cwd: tempDir });
      execSync('git commit -m "initial"', { cwd: tempDir });
    });

    afterAll(() => {
      fs.rmSync(tempDir, { recursive: true, force: true });
    });

    when('[t0] capture is attempted', () => {
      then('should throw error about absent claude project', async () => {
        const scope = getReflectScope({ cwd: tempDir });
        const error = await getError(async () => captureSnapshot({ scope }));
        expect(error).toBeDefined();
        expect(error.message).toContain('no claude code project found');
      });
    });
  });
});
