import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { given, then, when } from 'test-fns';

import { setSelfReviewTriggeredReport } from './setSelfReviewTriggeredReport';

describe('setSelfReviewTriggeredReport', () => {
  given('[case1] .route directory does not yet found', () => {
    when('[t0] setSelfReviewTriggeredReport called', () => {
      const tempDir = path.join(
        os.tmpdir(),
        `test-set-triggered-${Date.now()}-1`,
      );

      then('creates .route directory and marker file', async () => {
        const result = await setSelfReviewTriggeredReport({
          stone: '1.vision',
          slug: 'all-done',
          hash: 'abc123',
          route: tempDir,
        });

        // verify .route dir created
        const routeDir = path.join(tempDir, '.route');
        const routeFound = await fs
          .access(routeDir)
          .then(() => true)
          .catch(() => false);
        expect(routeFound).toBe(true);

        // verify marker file created
        const markerFound = await fs
          .access(result.path)
          .then(() => true)
          .catch(() => false);
        expect(markerFound).toBe(true);

        // cleanup
        await fs.rm(tempDir, { recursive: true, force: true });
      });

      then('returns marker file path', async () => {
        const result = await setSelfReviewTriggeredReport({
          stone: '1.vision',
          slug: 'all-done',
          hash: 'abc123',
          route: tempDir,
        });

        expect(result.path).toContain(
          '1.vision.guard.selfreview.all-done.abc123.triggered',
        );

        // cleanup
        await fs.rm(tempDir, { recursive: true, force: true });
      });
    });
  });

  given('[case2] marker file content', () => {
    when('[t0] setSelfReviewTriggeredReport called', () => {
      const tempDir = path.join(
        os.tmpdir(),
        `test-set-triggered-${Date.now()}-2`,
      );

      then('writes slug and hash in content', async () => {
        const result = await setSelfReviewTriggeredReport({
          stone: '1.vision',
          slug: 'all-done',
          hash: 'abc123',
          route: tempDir,
        });

        const content = await fs.readFile(result.path, 'utf-8');
        expect(content).toContain('slug: all-done');
        expect(content).toContain('hash: abc123');

        // cleanup
        await fs.rm(tempDir, { recursive: true, force: true });
      });
    });
  });

  given('[case3] marker file already found', () => {
    when('[t0] setSelfReviewTriggeredReport called twice', () => {
      const tempDir = path.join(
        os.tmpdir(),
        `test-set-triggered-${Date.now()}-3`,
      );

      then('preserves original mtime (idempotent)', async () => {
        // first call
        const result1 = await setSelfReviewTriggeredReport({
          stone: '1.vision',
          slug: 'all-done',
          hash: 'abc123',
          route: tempDir,
        });
        const stat1 = await fs.stat(result1.path);
        const mtime1 = stat1.mtime.getTime();

        // wait a bit
        await new Promise((resolve) => setTimeout(resolve, 50));

        // second call
        const result2 = await setSelfReviewTriggeredReport({
          stone: '1.vision',
          slug: 'all-done',
          hash: 'abc123',
          route: tempDir,
        });
        const stat2 = await fs.stat(result2.path);
        const mtime2 = stat2.mtime.getTime();

        // mtime should be preserved
        expect(mtime2).toEqual(mtime1);

        // cleanup
        await fs.rm(tempDir, { recursive: true, force: true });
      });
    });
  });
});
