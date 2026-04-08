import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { given, then, when } from 'test-fns';

import { setCoverage } from './setCoverage';

describe('setCoverage.integration', () => {
  given('[case1] file system persistence', () => {
    const tempDir = path.join(
      os.tmpdir(),
      `test-setCoverage-persist-${Date.now()}`,
    );

    afterEach(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    when('[t0] coverage entries are written', () => {
      then('file exists on disk with correct content', async () => {
        const result = await setCoverage({
          hashes: ['hash1', 'hash2'],
          goalSlug: 'fix-auth-test',
          scopeDir: tempDir,
        });

        // verify coverage entries
        expect(result.coverage).toHaveLength(2);
        expect(result.coverage[0]?.hash).toEqual('hash1');
        expect(result.coverage[0]?.goalSlug).toEqual('fix-auth-test');
        expect(result.coverage[1]?.hash).toEqual('hash2');
        expect(result.coverage[1]?.goalSlug).toEqual('fix-auth-test');

        // verify file exists
        const coveragePath = path.join(tempDir, 'asks.coverage.jsonl');
        const stat = await fs.stat(coveragePath);
        expect(stat.isFile()).toBe(true);

        // verify content is correct
        const content = await fs.readFile(coveragePath, 'utf-8');
        const lines = content.trim().split('\n');
        expect(lines).toHaveLength(2);

        const parsed = lines.map((line) => JSON.parse(line));
        expect(parsed[0].hash).toEqual('hash1');
        expect(parsed[0].goalSlug).toEqual('fix-auth-test');
        expect(parsed[1].hash).toEqual('hash2');
        expect(parsed[1].goalSlug).toEqual('fix-auth-test');
      });
    });
  });

  given('[case2] single hash coverage', () => {
    const tempDir = path.join(
      os.tmpdir(),
      `test-setCoverage-single-${Date.now()}`,
    );

    afterEach(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    when('[t0] single hash covered', () => {
      then('one entry should be written', async () => {
        const result = await setCoverage({
          hashes: ['single-hash'],
          goalSlug: 'update-readme',
          scopeDir: tempDir,
        });

        expect(result.coverage).toHaveLength(1);
        expect(result.coverage[0]?.hash).toEqual('single-hash');

        const coveragePath = path.join(tempDir, 'asks.coverage.jsonl');
        const content = await fs.readFile(coveragePath, 'utf-8');
        const lines = content.trim().split('\n');
        expect(lines).toHaveLength(1);
      });
    });
  });

  given('[case3] multiple goals cover multiple asks', () => {
    const tempDir = path.join(
      os.tmpdir(),
      `test-setCoverage-multi-${Date.now()}`,
    );

    afterEach(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    when('[t0] multiple coverage entries appended', () => {
      then('all entries should be preserved', async () => {
        await setCoverage({
          hashes: ['hash1'],
          goalSlug: 'goal-a',
          scopeDir: tempDir,
        });

        await setCoverage({
          hashes: ['hash2', 'hash3'],
          goalSlug: 'goal-b',
          scopeDir: tempDir,
        });

        const coveragePath = path.join(tempDir, 'asks.coverage.jsonl');
        const content = await fs.readFile(coveragePath, 'utf-8');
        const lines = content.trim().split('\n');
        expect(lines).toHaveLength(3);

        const parsed = lines.map((line) => JSON.parse(line));
        expect(parsed[0].goalSlug).toEqual('goal-a');
        expect(parsed[1].goalSlug).toEqual('goal-b');
        expect(parsed[2].goalSlug).toEqual('goal-b');
      });
    });
  });
});
