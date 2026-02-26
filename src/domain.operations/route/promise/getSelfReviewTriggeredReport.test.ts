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

  given('[case2] marker file found', () => {
    when('[t0] marker file was created', () => {
      const tempDir = path.join(
        os.tmpdir(),
        `test-get-triggered-${Date.now()}-2`,
      );

      then('returns mtime from file', async () => {
        // create marker file
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
        expect(result?.mtime.getTime()).toBeGreaterThan(0);

        // cleanup
        await fs.rm(tempDir, { recursive: true, force: true });
      });
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
});
