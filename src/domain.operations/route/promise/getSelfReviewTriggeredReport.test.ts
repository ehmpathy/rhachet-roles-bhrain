import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { given, then, when } from 'test-fns';

import { getSelfReviewTriggeredReport } from './getSelfReviewTriggeredReport';
import { setSelfReviewTriggeredReport } from './setSelfReviewTriggeredReport';

describe('getSelfReviewTriggeredReport', () => {
  given('[case1] marker file absent', () => {
    when('[t0] getSelfReviewTriggeredReport called', () => {
      const tempDir = path.join(
        os.tmpdir(),
        `test-get-triggered-${Date.now()}-1`,
      );

      then('returns null', async () => {
        const result = await getSelfReviewTriggeredReport({
          stone: '1.vision',
          slug: 'all-done',
          hash: 'abc123',
          route: tempDir,
        });

        expect(result).toBeNull();
      });
    });
  });

  given('[case2] marker files found', () => {
    when('[t0] marker files were created', () => {
      const tempDir = path.join(
        os.tmpdir(),
        `test-get-triggered-${Date.now()}-2`,
      );

      then(
        'returns sinceMtime, uptilMtime, and attempts from files',
        async () => {
          // create marker files
          await setSelfReviewTriggeredReport({
            stone: '1.vision',
            slug: 'all-done',
            hash: 'abc123',
            route: tempDir,
          });

          // get report
          const result = await getSelfReviewTriggeredReport({
            stone: '1.vision',
            slug: 'all-done',
            hash: 'abc123',
            route: tempDir,
          });

          // verify result
          expect(result).not.toBeNull();
          expect(result?.sinceMtime.getTime()).toBeGreaterThan(0);
          expect(result?.uptilMtime.getTime()).toBeGreaterThan(0);
          expect(result?.attempts).toEqual(1);

          // cleanup
          await fs.rm(tempDir, { recursive: true, force: true });
        },
      );
    });
  });

  given('[case3] hash mismatch', () => {
    when('[t0] marker file found for different hash', () => {
      const tempDir = path.join(
        os.tmpdir(),
        `test-get-triggered-${Date.now()}-3`,
      );

      then('returns null for different hash', async () => {
        // create marker file with hash abc123
        await setSelfReviewTriggeredReport({
          stone: '1.vision',
          slug: 'all-done',
          hash: 'abc123',
          route: tempDir,
        });

        // get report for different hash
        const result = await getSelfReviewTriggeredReport({
          stone: '1.vision',
          slug: 'all-done',
          hash: 'xyz789',
          route: tempDir,
        });

        expect(result).toBeNull();

        // cleanup
        await fs.rm(tempDir, { recursive: true, force: true });
      });
    });
  });

  given('[case4] .uptil absent (graceful fallback)', () => {
    when('[t0] only .since file found', () => {
      const tempDir = path.join(
        os.tmpdir(),
        `test-get-triggered-${Date.now()}-4`,
      );

      then('uptilMtime equals sinceMtime', async () => {
        // create marker files
        const result1 = await setSelfReviewTriggeredReport({
          stone: '1.vision',
          slug: 'all-done',
          hash: 'abc123',
          route: tempDir,
        });

        // delete .uptil file to simulate partial state
        await fs.rm(result1.uptilPath, { force: true });

        // get report
        const result = await getSelfReviewTriggeredReport({
          stone: '1.vision',
          slug: 'all-done',
          hash: 'abc123',
          route: tempDir,
        });

        // verify graceful fallback
        expect(result).not.toBeNull();
        expect(result?.uptilMtime.getTime()).toEqual(
          result?.sinceMtime.getTime(),
        );

        // cleanup
        await fs.rm(tempDir, { recursive: true, force: true });
      });
    });
  });

  given('[case5] marker file found with attempts', () => {
    when('[t0] marker file has attempts: 3', () => {
      const tempDir = path.join(
        os.tmpdir(),
        `test-get-triggered-${Date.now()}-5`,
      );

      then('returns parsed attempts', async () => {
        // create marker file with attempts via multiple calls
        await setSelfReviewTriggeredReport({
          stone: '1.vision',
          slug: 'all-done',
          hash: 'abc123',
          route: tempDir,
        });
        await setSelfReviewTriggeredReport({
          stone: '1.vision',
          slug: 'all-done',
          hash: 'abc123',
          route: tempDir,
        });
        await setSelfReviewTriggeredReport({
          stone: '1.vision',
          slug: 'all-done',
          hash: 'abc123',
          route: tempDir,
        });

        // get report
        const result = await getSelfReviewTriggeredReport({
          stone: '1.vision',
          slug: 'all-done',
          hash: 'abc123',
          route: tempDir,
        });

        // verify result
        expect(result).not.toBeNull();
        expect(result?.attempts).toEqual(3);

        // cleanup
        await fs.rm(tempDir, { recursive: true, force: true });
      });
    });
  });
});
