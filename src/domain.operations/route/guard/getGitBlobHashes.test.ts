import { execSync } from 'child_process';
import * as fs from 'fs/promises';
import * as path from 'path';
import { given, then, when } from 'test-fns';

import { getGitBlobHashes } from './getGitBlobHashes';

describe('getGitBlobHashes', () => {
  given('[case1] committed file in repo', () => {
    const cwd = process.cwd();
    // use tsconfig.json instead of package.json since package.json may be modified
    const files = ['tsconfig.json'];

    when('[t0] hashes are computed', () => {
      then('returns hash for committed file', () => {
        const result = getGitBlobHashes({ files, cwd });
        const hash = result['tsconfig.json'];
        expect(hash).toBeDefined();
        expect(hash?.length).toEqual(40); // sha1 hex length
      });

      then('hash matches git ls-tree output', () => {
        const result = getGitBlobHashes({ files, cwd });
        const lsTreeOutput = execSync('git ls-tree HEAD tsconfig.json', {
          cwd,
          encoding: 'utf-8',
        });
        const expectedHash = lsTreeOutput.match(/blob ([a-f0-9]+)/)?.[1];
        expect(result['tsconfig.json']).toEqual(expectedHash);
      });
    });
  });

  given('[case2] modified file (staged or unstaged)', () => {
    const cwd = process.cwd();
    const testFile = '.test-modified-file.tmp';

    beforeAll(async () => {
      // create a file that differs from HEAD
      await fs.writeFile(path.join(cwd, testFile), 'modified content');
    });

    afterAll(async () => {
      await fs.unlink(path.join(cwd, testFile)).catch(() => {});
    });

    when('[t0] hashes are computed', () => {
      then('returns hash-object computed hash', () => {
        const result = getGitBlobHashes({ files: [testFile], cwd });
        const hash = result[testFile];
        expect(hash).toBeDefined();
        expect(hash?.length).toEqual(40);

        // verify it matches git hash-object
        const expectedHash = execSync(`git hash-object "${testFile}"`, {
          cwd,
          encoding: 'utf-8',
        }).trim();
        expect(result[testFile]).toEqual(expectedHash);
      });
    });
  });

  given('[case3] untracked file', () => {
    const cwd = process.cwd();
    const testFile = '.test-untracked-file.tmp';

    beforeAll(async () => {
      await fs.writeFile(path.join(cwd, testFile), 'untracked content');
    });

    afterAll(async () => {
      await fs.unlink(path.join(cwd, testFile)).catch(() => {});
    });

    when('[t0] hashes are computed', () => {
      then('returns hash-object computed hash', () => {
        const result = getGitBlobHashes({ files: [testFile], cwd });
        expect(result[testFile]).toBeDefined();

        const expectedHash = execSync(`git hash-object "${testFile}"`, {
          cwd,
          encoding: 'utf-8',
        }).trim();
        expect(result[testFile]).toEqual(expectedHash);
      });
    });
  });

  given('[case4] batch of 100+ files', () => {
    const cwd = process.cwd();
    const files = execSync('git ls-files | head -200', {
      cwd,
      encoding: 'utf-8',
    })
      .trim()
      .split('\n')
      .filter(Boolean);

    when('[t0] hashes are computed', () => {
      then('returns hashes for all files efficiently', () => {
        const startTime = Date.now();
        const result = getGitBlobHashes({ files, cwd });
        const elapsed = Date.now() - startTime;

        expect(Object.keys(result).length).toBeGreaterThanOrEqual(100);
        expect(elapsed).toBeLessThan(5000); // should complete in < 5s
      });
    });
  });

  given('[case5] empty file list', () => {
    when('[t0] hashes are computed', () => {
      then('returns empty object', () => {
        const result = getGitBlobHashes({ files: [], cwd: process.cwd() });
        expect(result).toEqual({});
      });
    });
  });

  given('[case6] all 1110+ src files (OOM proof)', () => {
    const cwd = process.cwd();
    const files = execSync("git ls-files 'src/**/*'", {
      cwd,
      encoding: 'utf-8',
    })
      .trim()
      .split('\n')
      .filter(Boolean);

    when('[t0] hashes are computed for entire src tree', () => {
      then('completes without OOM and returns all hashes', () => {
        const startMem = process.memoryUsage().heapUsed;
        const startTime = Date.now();

        const result = getGitBlobHashes({ files, cwd });

        const elapsed = Date.now() - startTime;
        const memDelta = process.memoryUsage().heapUsed - startMem;
        const memDeltaMB = memDelta / 1024 / 1024;

        // proof of OOM fix:
        // - before: loaded 1110 file contents = OOM
        // - after: only 40-char hashes per file = ~50KB max
        expect(Object.keys(result).length).toBeGreaterThanOrEqual(1000);
        expect(elapsed).toBeLessThan(10000); // < 10s for 1110 files
        expect(memDeltaMB).toBeLessThan(100); // < 100MB heap growth
      });
    });
  });
});
