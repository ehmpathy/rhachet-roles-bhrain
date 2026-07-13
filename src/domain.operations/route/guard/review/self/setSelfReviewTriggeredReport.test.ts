import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { given, then, when } from 'test-fns';

import { setSelfReviewTriggeredReport } from './setSelfReviewTriggeredReport';

const sleep = (ms: number) => new Promise<void>((done) => setTimeout(done, ms));

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

      then('returns both marker file paths and attempts', async () => {
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
        expect(result.attempts).toEqual(1);

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

      then('writes slug, hash, and attempts in .since content', async () => {
        const result = await setSelfReviewTriggeredReport({
          stone: '1.vision',
          slug: 'all-done',
          hash: 'abc123',
          route: tempDir,
        });

        const content = await fs.readFile(result.sincePath, 'utf-8');
        expect(content).toContain('slug: all-done');
        expect(content).toContain('hash: abc123');
        expect(content).toContain('attempts: 1');

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

      then(
        '.since mtime preserved, .uptil mtime updated, attempts incremented',
        async () => {
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
          expect(result1.attempts).toEqual(1);

          // wait a bit to ensure mtime difference
          await sleep(50);

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

          // attempts should be incremented
          expect(result2.attempts).toEqual(2);

          // cleanup
          await fs.rm(tempDir, { recursive: true, force: true });
        },
      );
    });
  });

  given('[case5] three attempts on same hash', () => {
    when('[t0] setSelfReviewTriggeredReport called 3x', () => {
      const tempDir = path.join(
        os.tmpdir(),
        `test-set-triggered-${Date.now()}-5`,
      );

      then('attempts increments to 3', async () => {
        const result1 = await setSelfReviewTriggeredReport({
          stone: '1.vision',
          slug: 'all-done',
          hash: 'abc123',
          route: tempDir,
        });
        expect(result1.attempts).toEqual(1);

        const result2 = await setSelfReviewTriggeredReport({
          stone: '1.vision',
          slug: 'all-done',
          hash: 'abc123',
          route: tempDir,
        });
        expect(result2.attempts).toEqual(2);

        const result3 = await setSelfReviewTriggeredReport({
          stone: '1.vision',
          slug: 'all-done',
          hash: 'abc123',
          route: tempDir,
        });
        expect(result3.attempts).toEqual(3);

        // cleanup
        await fs.rm(tempDir, { recursive: true, force: true });
      });
    });
  });
});
