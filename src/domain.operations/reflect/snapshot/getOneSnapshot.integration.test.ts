import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { given, then, useBeforeAll, when } from 'test-fns';

import { getReflectScope } from '../scope/getReflectScope';
import { captureSnapshot } from './captureSnapshot';
import { getOneSnapshot } from './getOneSnapshot';

/**
 * .what = creates a mock claude code project for tests
 * .why = captureSnapshot requires transcript source to exist
 */
const setupMockClaudeProject = (input: { cwd: string }): string => {
  const slug = input.cwd.replace(/\//g, '-');
  const projectDir = path.join(os.homedir(), '.claude', 'projects', slug);
  fs.mkdirSync(projectDir, { recursive: true });

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

describe('getOneSnapshot', () => {
  given('[case1] snapshot exists', () => {
    const tempDir = path.join(os.tmpdir(), `reflect-getone-snap-${Date.now()}`);
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

      // get scope and capture snapshot
      const scope = getReflectScope({ cwd: tempDir });
      const snapshot = await captureSnapshot({ scope });

      return { scope, snapshot };
    });

    afterAll(() => {
      fs.rmSync(tempDir, { recursive: true, force: true });
      if (mockProjectDir && fs.existsSync(mockProjectDir)) {
        fs.rmSync(mockProjectDir, { recursive: true, force: true });
      }
    });

    when('[t0] snapshot is retrieved by timestamp', () => {
      then('should return snapshot details', () => {
        const result = getOneSnapshot({
          scope: scene.scope,
          at: scene.snapshot.timestamp,
        });
        expect(result).not.toBeNull();
      });

      then('should have correct timestamp', () => {
        const result = getOneSnapshot({
          scope: scene.scope,
          at: scene.snapshot.timestamp,
        });
        expect(result?.timestamp).toEqual(scene.snapshot.timestamp);
      });

      then('should have correct path', () => {
        const result = getOneSnapshot({
          scope: scene.scope,
          at: scene.snapshot.timestamp,
        });
        expect(result?.path).toEqual(scene.snapshot.path);
      });

      then('should have size in bytes', () => {
        const result = getOneSnapshot({
          scope: scene.scope,
          at: scene.snapshot.timestamp,
        });
        expect(result?.sizeBytes).toBeGreaterThan(0);
      });

      then('should have metadata', () => {
        const result = getOneSnapshot({
          scope: scene.scope,
          at: scene.snapshot.timestamp,
        });
        expect(result?.metadata).toBeDefined();
        expect(result?.metadata.transcript.sessionCount).toBeGreaterThan(0);
      });
    });
  });

  given('[case2] snapshot does not exist', () => {
    const tempDir = path.join(
      os.tmpdir(),
      `reflect-getone-snap-noexist-${Date.now()}`,
    );

    beforeAll(() => {
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

    when('[t0] non-existent timestamp is requested', () => {
      then('should return null', () => {
        const scope = getReflectScope({ cwd: tempDir });
        const result = getOneSnapshot({
          scope,
          at: '2020-01-01.000000',
        });
        expect(result).toBeNull();
      });
    });
  });
});
