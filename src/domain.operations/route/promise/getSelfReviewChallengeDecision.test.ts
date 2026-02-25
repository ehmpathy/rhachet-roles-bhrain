import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { given, then, when } from 'test-fns';

import { getSelfReviewChallengeDecision } from './getSelfReviewChallengeDecision';
import { setSelfReviewTriggeredReport } from './setSelfReviewTriggeredReport';

describe('getSelfReviewChallengeDecision', () => {
  given('[case1] no trigger report found', () => {
    when('[t0] getSelfReviewChallengeDecision called', () => {
      const tempDir = path.join(os.tmpdir(), `test-challenge-${Date.now()}-1`);

      then('returns challenged and creates trigger report', async () => {
        const result = await getSelfReviewChallengeDecision({
          stone: '1.vision',
          slug: 'all-done',
          hash: 'abc123',
          route: tempDir,
        });

        // verify decision
        expect(result.decision).toEqual('challenged');

        // verify trigger report was created
        const markerPath = path.join(
          tempDir,
          '.route',
          '1.vision.guard.selfreview.all-done.abc123.triggered',
        );
        const markerFound = await fs
          .access(markerPath)
          .then(() => true)
          .catch(() => false);
        expect(markerFound).toBe(true);

        // cleanup
        await fs.rm(tempDir, { recursive: true, force: true });
      });
    });
  });

  given('[case2] trigger report found but elapsed < 90 seconds', () => {
    when('[t0] getSelfReviewChallengeDecision called immediately', () => {
      const tempDir = path.join(os.tmpdir(), `test-challenge-${Date.now()}-2`);

      then('returns challenged', async () => {
        // create trigger report
        await setSelfReviewTriggeredReport({
          stone: '1.vision',
          slug: 'all-done',
          hash: 'abc123',
          route: tempDir,
        });

        // call immediately (< 90 seconds)
        const result = await getSelfReviewChallengeDecision({
          stone: '1.vision',
          slug: 'all-done',
          hash: 'abc123',
          route: tempDir,
        });

        expect(result.decision).toEqual('challenged');

        // cleanup
        await fs.rm(tempDir, { recursive: true, force: true });
      });
    });
  });

  given('[case3] trigger report found and elapsed >= 90 seconds', () => {
    when('[t0] getSelfReviewChallengeDecision called after 90 seconds', () => {
      const tempDir = path.join(os.tmpdir(), `test-challenge-${Date.now()}-3`);

      then('returns allowed', async () => {
        // create trigger report
        const result1 = await setSelfReviewTriggeredReport({
          stone: '1.vision',
          slug: 'all-done',
          hash: 'abc123',
          route: tempDir,
        });

        // backdate the file mtime to 91 seconds ago
        const mtimePast = new Date(Date.now() - 91 * 1000);
        await fs.utimes(result1.path, mtimePast, mtimePast);

        // call after sufficient time
        const result = await getSelfReviewChallengeDecision({
          stone: '1.vision',
          slug: 'all-done',
          hash: 'abc123',
          route: tempDir,
        });

        expect(result.decision).toEqual('allowed');

        // cleanup
        await fs.rm(tempDir, { recursive: true, force: true });
      });
    });
  });
});
