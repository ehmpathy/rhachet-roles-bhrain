import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { given, then, useThen, when } from 'test-fns';

import { getRepoRootWithFallback } from './getRepoRootWithFallback';

describe('getRepoRootWithFallback', () => {
  given('[case1] a path inside this git repo', () => {
    when('[t0] looked up', () => {
      const found = useThen('resolves a root', async () => ({
        root: await getRepoRootWithFallback({ from: __dirname }),
      }));

      then('returns the git repo root (contains package.json)', async () => {
        const hasPackageJson = await fs
          .access(path.join(found.root, 'package.json'))
          .then(() => true)
          .catch(() => false);
        expect(hasPackageJson).toBe(true);
      });
    });
  });

  given('[case2] a temp dir that is not a git repo', () => {
    const tempDir = path.join(os.tmpdir(), `test-reporoot-${Date.now()}`);

    beforeEach(async () => {
      await fs.mkdir(tempDir, { recursive: true });
    });

    afterEach(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    when('[t0] looked up', () => {
      then('falls back to process.cwd()', async () => {
        const root = await getRepoRootWithFallback({ from: tempDir });
        expect(root).toEqual(process.cwd());
      });
    });
  });
});
