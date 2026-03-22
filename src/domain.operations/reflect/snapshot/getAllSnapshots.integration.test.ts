import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { given, then, useBeforeAll, when } from 'test-fns';

import { getReflectScope } from '../scope/getReflectScope';
import { captureSnapshot } from './captureSnapshot';
import { getAllSnapshots } from './getAllSnapshots';

/**
 * .what = delay helper for test wait
 * .why = ensures different timestamps between snapshots
 */
const delay = (ms: number): Promise<void> =>
  new Promise((done) => setTimeout(done, ms));

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

describe('getAllSnapshots', () => {
  given('[case1] multiple snapshots exist', () => {
    const tempDir = path.join(os.tmpdir(), `reflect-getall-snap-${Date.now()}`);
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

      // capture first snapshot
      const snapshot1 = await captureSnapshot({ scope });

      // wait to ensure different timestamp
      await delay(1100);

      // capture second snapshot
      const snapshot2 = await captureSnapshot({ scope });

      return { scope, snapshot1, snapshot2 };
    });

    afterAll(() => {
      fs.rmSync(tempDir, { recursive: true, force: true });
      if (mockProjectDir && fs.existsSync(mockProjectDir)) {
        fs.rmSync(mockProjectDir, { recursive: true, force: true });
      }
    });

    when('[t0] all snapshots are retrieved', () => {
      then('should return 2 snapshots', () => {
        const result = getAllSnapshots({ scope: scene.scope });
        expect(result.count).toEqual(2);
        expect(result.snapshots).toHaveLength(2);
      });

      then('snapshots should be sorted oldest first', () => {
        const result = getAllSnapshots({ scope: scene.scope });
        expect(result.snapshots[0]?.timestamp).toEqual(
          scene.snapshot1.timestamp,
        );
        expect(result.snapshots[1]?.timestamp).toEqual(
          scene.snapshot2.timestamp,
        );
      });

      then('totalBytes should sum all snapshot sizes', () => {
        const result = getAllSnapshots({ scope: scene.scope });
        const expectedTotal = result.snapshots.reduce(
          (sum, s) => sum + s.sizeBytes,
          0,
        );
        expect(result.totalBytes).toEqual(expectedTotal);
        expect(result.totalBytes).toBeGreaterThan(0);
      });

      then('each snapshot should have metadata', () => {
        const result = getAllSnapshots({ scope: scene.scope });
        for (const snapshot of result.snapshots) {
          expect(snapshot.metadata).not.toBeNull();
          expect(snapshot.metadata?.transcript.sessionCount).toBeGreaterThan(0);
        }
      });
    });
  });

  given('[case2] no snapshots exist', () => {
    const tempDir = path.join(
      os.tmpdir(),
      `reflect-getall-snap-empty-${Date.now()}`,
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

    when('[t0] all snapshots are retrieved', () => {
      then('should return empty summary', () => {
        const scope = getReflectScope({ cwd: tempDir });
        const result = getAllSnapshots({ scope });
        expect(result.count).toEqual(0);
        expect(result.totalBytes).toEqual(0);
        expect(result.snapshots).toHaveLength(0);
      });
    });
  });
});
