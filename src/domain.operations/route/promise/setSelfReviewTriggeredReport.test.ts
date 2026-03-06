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

      then('creates .route directory and both marker files', async () => {
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

        // verify .since file created
        const sinceFound = await fs
          .access(result.sincePath)
          .then(() => true)
          .catch(() => false);
        expect(sinceFound).toBe(true);

        // verify .uptil file created
        const uptilFound = await fs
          .access(result.uptilPath)
          .then(() => true)
          .catch(() => false);
        expect(uptilFound).toBe(true);

        // cleanup
        await fs.rm(tempDir, { recursive: true, force: true });
      });

      then('returns both marker file paths', async () => {
        const result = await setSelfReviewTriggeredReport({
          stone: '1.vision',
          slug: 'all-done',
          hash: 'abc123',
          route: tempDir,
        });

        expect(result.sincePath).toContain(
          '1.vision.guard.selfreview.all-done.abc123.triggered.since',
        );
        expect(result.uptilPath).toContain(
          '1.vision.guard.selfreview.all-done.abc123.triggered.uptil',
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

      then('writes slug and hash in .since content', async () => {
        const result = await setSelfReviewTriggeredReport({
          stone: '1.vision',
          slug: 'all-done',
          hash: 'abc123',
          route: tempDir,
        });

        const content = await fs.readFile(result.sincePath, 'utf-8');
        expect(content).toContain('slug: all-done');
        expect(content).toContain('hash: abc123');

        // cleanup
        await fs.rm(tempDir, { recursive: true, force: true });
      });

      then('writes slug and hash in .uptil content', async () => {
        const result = await setSelfReviewTriggeredReport({
          stone: '1.vision',
          slug: 'all-done',
          hash: 'abc123',
          route: tempDir,
        });

        const content = await fs.readFile(result.uptilPath, 'utf-8');
        expect(content).toContain('slug: all-done');
        expect(content).toContain('hash: abc123');

        // cleanup
        await fs.rm(tempDir, { recursive: true, force: true });
      });
    });
  });

  given('[case3] first call creates both files with same mtime', () => {
    when('[t0] setSelfReviewTriggeredReport called once', () => {
      const tempDir = path.join(
        os.tmpdir(),
        `test-set-triggered-${Date.now()}-3`,
      );

      then('.since and .uptil have same mtime (within tolerance)', async () => {
        const result = await setSelfReviewTriggeredReport({
          stone: '1.vision',
          slug: 'all-done',
          hash: 'abc123',
          route: tempDir,
        });

        const sinceStat = await fs.stat(result.sincePath);
        const uptilStat = await fs.stat(result.uptilPath);

        // mtimes should be within 100ms of each other
        const sinceMtime = sinceStat.mtime.getTime();
        const uptilMtime = uptilStat.mtime.getTime();
        expect(Math.abs(sinceMtime - uptilMtime)).toBeLessThan(100);

        // cleanup
        await fs.rm(tempDir, { recursive: true, force: true });
      });
    });
  });

  given('[case4] marker file already found', () => {
    when('[t0] setSelfReviewTriggeredReport called twice', () => {
      const tempDir = path.join(
        os.tmpdir(),
        `test-set-triggered-${Date.now()}-4`,
      );

      then('.since mtime preserved, .uptil mtime updated', async () => {
        // first call
        const result1 = await setSelfReviewTriggeredReport({
          stone: '1.vision',
          slug: 'all-done',
          hash: 'abc123',
          route: tempDir,
        });
        const sinceStat1 = await fs.stat(result1.sincePath);
        const sinceMtime1 = sinceStat1.mtime.getTime();
        const uptilStat1 = await fs.stat(result1.uptilPath);
        const uptilMtime1 = uptilStat1.mtime.getTime();

        // wait a bit to ensure mtime difference
        await new Promise((done) => setTimeout(done, 50));

        // second call
        const result2 = await setSelfReviewTriggeredReport({
          stone: '1.vision',
          slug: 'all-done',
          hash: 'abc123',
          route: tempDir,
        });
        const sinceStat2 = await fs.stat(result2.sincePath);
        const sinceMtime2 = sinceStat2.mtime.getTime();
        const uptilStat2 = await fs.stat(result2.uptilPath);
        const uptilMtime2 = uptilStat2.mtime.getTime();

        // .since mtime should be preserved
        expect(sinceMtime2).toEqual(sinceMtime1);

        // .uptil mtime should be updated (newer)
        expect(uptilMtime2).toBeGreaterThan(uptilMtime1);

        // cleanup
        await fs.rm(tempDir, { recursive: true, force: true });
      });
    });
  });
});
