import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { given, then, when } from 'test-fns';

import { setAsk } from './setAsk';

describe('setAsk.integration', () => {
  given('[case1] file system persistence', () => {
    const tempDir = path.join(os.tmpdir(), `test-setAsk-persist-${Date.now()}`);

    afterEach(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    when('[t0] ask is written', () => {
      then('file exists on disk with correct content', async () => {
        const result = await setAsk({
          content: 'fix the flaky test in auth.test.ts',
          scopeDir: tempDir,
        });

        // verify hash is deterministic (sha256 of content)
        expect(result.ask.hash).toHaveLength(64);
        expect(result.ask.content).toEqual(
          'fix the flaky test in auth.test.ts',
        );
        expect(result.ask.receivedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);

        // verify file exists
        const inventoryPath = path.join(tempDir, 'asks.inventory.jsonl');
        const stat = await fs.stat(inventoryPath);
        expect(stat.isFile()).toBe(true);

        // verify content is correct
        const content = await fs.readFile(inventoryPath, 'utf-8');
        const parsed = JSON.parse(content.trim());
        expect(parsed.hash).toEqual(result.ask.hash);
        expect(parsed.content).toEqual('fix the flaky test in auth.test.ts');
      });
    });
  });

  given('[case2] hash determinism', () => {
    const tempDir = path.join(os.tmpdir(), `test-setAsk-hash-${Date.now()}`);

    afterEach(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    when('[t0] same content hashed twice', () => {
      then('hashes should be identical', async () => {
        const result1 = await setAsk({
          content: 'update the readme',
          scopeDir: path.join(tempDir, 'dir1'),
        });

        const result2 = await setAsk({
          content: 'update the readme',
          scopeDir: path.join(tempDir, 'dir2'),
        });

        expect(result1.ask.hash).toEqual(result2.ask.hash);
      });
    });

    when('[t1] different content hashed', () => {
      then('hashes should differ', async () => {
        const result1 = await setAsk({
          content: 'fix the test',
          scopeDir: path.join(tempDir, 'dir1'),
        });

        const result2 = await setAsk({
          content: 'update the readme',
          scopeDir: path.join(tempDir, 'dir2'),
        });

        expect(result1.ask.hash).not.toEqual(result2.ask.hash);
      });
    });
  });

  given('[case3] multiple asks appended', () => {
    const tempDir = path.join(os.tmpdir(), `test-setAsk-multi-${Date.now()}`);

    afterEach(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    when('[t0] multiple asks written to same file', () => {
      then('all asks should be preserved in order', async () => {
        await setAsk({ content: 'first ask', scopeDir: tempDir });
        await setAsk({ content: 'second ask', scopeDir: tempDir });
        await setAsk({ content: 'third ask', scopeDir: tempDir });

        const inventoryPath = path.join(tempDir, 'asks.inventory.jsonl');
        const content = await fs.readFile(inventoryPath, 'utf-8');
        const lines = content.trim().split('\n');

        expect(lines).toHaveLength(3);

        const parsed = lines.map((line) => JSON.parse(line));
        expect(parsed[0].content).toEqual('first ask');
        expect(parsed[1].content).toEqual('second ask');
        expect(parsed[2].content).toEqual('third ask');
      });
    });
  });
});
