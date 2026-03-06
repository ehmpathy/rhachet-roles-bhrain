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

      then('returns challenge:first and creates trigger report', async () => {
        const result = await getSelfReviewChallengeDecision({
          stone: '1.vision',
          slug: 'all-done',
          hash: 'abc123',
          route: tempDir,
        });

        // verify decision
        expect(result.decision).toEqual('challenge:first');

        // verify trigger reports were created
        const sincePath = path.join(
          tempDir,
          '.route',
          '1.vision.guard.selfreview.all-done.abc123.triggered.since',
        );
        const uptilPath = path.join(
          tempDir,
          '.route',
          '1.vision.guard.selfreview.all-done.abc123.triggered.uptil',
        );
        const sinceFound = await fs
          .access(sincePath)
          .then(() => true)
          .catch(() => false);
        const uptilFound = await fs
          .access(uptilPath)
          .then(() => true)
          .catch(() => false);
        expect(sinceFound).toBe(true);
        expect(uptilFound).toBe(true);

        // cleanup
        await fs.rm(tempDir, { recursive: true, force: true });
      });
    });
  });

  given('[case2] trigger report found but elapsed < 30 seconds', () => {
    when('[t0] getSelfReviewChallengeDecision called second time', () => {
      const tempDir = path.join(os.tmpdir(), `test-challenge-${Date.now()}-2`);

      then('returns challenge:rushed', async () => {
        // first call creates trigger report
        await setSelfReviewTriggeredReport({
          stone: '1.vision',
          slug: 'all-done',
          hash: 'abc123',
          route: tempDir,
        });

        // wait a bit to create mtime gap
        await new Promise((done) => setTimeout(done, 50));

        // second call (< 30 seconds) should detect rush
        const result = await getSelfReviewChallengeDecision({
          stone: '1.vision',
          slug: 'all-done',
          hash: 'abc123',
          route: tempDir,
        });

        expect(result.decision).toEqual('challenge:rushed');

        // cleanup
        await fs.rm(tempDir, { recursive: true, force: true });
      });
    });
  });

  given('[case3] trigger report found and elapsed >= 30 seconds', () => {
    when('[t0] getSelfReviewChallengeDecision called after 30 seconds', () => {
      const tempDir = path.join(os.tmpdir(), `test-challenge-${Date.now()}-3`);

      then('returns allowed', async () => {
        // create trigger report
        const result1 = await setSelfReviewTriggeredReport({
          stone: '1.vision',
          slug: 'all-done',
          hash: 'abc123',
          route: tempDir,
        });

        // backdate both files to 31 seconds ago
        const mtimePast = new Date(Date.now() - 31 * 1000);
        await fs.utimes(result1.sincePath, mtimePast, mtimePast);
        await fs.utimes(result1.uptilPath, mtimePast, mtimePast);

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

  given('[case4] first challenge (no prior trigger)', () => {
    when('[t0] getSelfReviewChallengeDecision called on fresh route', () => {
      const tempDir = path.join(os.tmpdir(), `test-challenge-${Date.now()}-4`);

      then('returns challenge:first', async () => {
        const result = await getSelfReviewChallengeDecision({
          stone: '1.vision',
          slug: 'all-done',
          hash: 'abc123',
          route: tempDir,
        });

        expect(result.decision).toEqual('challenge:first');

        // cleanup
        await fs.rm(tempDir, { recursive: true, force: true });
      });
    });
  });

  given('[case5] rapid re-attempt (sinceMtime < uptilMtime)', () => {
    when('[t0] getSelfReviewChallengeDecision called rapidly', () => {
      const tempDir = path.join(os.tmpdir(), `test-challenge-${Date.now()}-5`);

      then('returns challenge:rushed', async () => {
        // first call creates trigger
        await getSelfReviewChallengeDecision({
          stone: '1.vision',
          slug: 'all-done',
          hash: 'abc123',
          route: tempDir,
        });

        // wait to create mtime gap
        await new Promise((done) => setTimeout(done, 50));

        // second call should detect rush
        const result = await getSelfReviewChallengeDecision({
          stone: '1.vision',
          slug: 'all-done',
          hash: 'abc123',
          route: tempDir,
        });

        expect(result.decision).toEqual('challenge:rushed');

        // cleanup
        await fs.rm(tempDir, { recursive: true, force: true });
      });
    });
  });

  given('[case6] plowthrough via 3 attempts on same hash', () => {
    when('[t0] getSelfReviewChallengeDecision called 3 times', () => {
      const tempDir = path.join(os.tmpdir(), `test-challenge-${Date.now()}-6`);

      then('returns allowed on 3rd attempt', async () => {
        // 1st attempt → challenge:first
        const result1 = await getSelfReviewChallengeDecision({
          stone: '1.vision',
          slug: 'all-done',
          hash: 'abc123',
          route: tempDir,
        });
        expect(result1.decision).toEqual('challenge:first');

        // 2nd attempt → challenge:rushed
        const result2 = await getSelfReviewChallengeDecision({
          stone: '1.vision',
          slug: 'all-done',
          hash: 'abc123',
          route: tempDir,
        });
        expect(result2.decision).toEqual('challenge:rushed');

        // 3rd attempt → allowed (plowthrough)
        const result3 = await getSelfReviewChallengeDecision({
          stone: '1.vision',
          slug: 'all-done',
          hash: 'abc123',
          route: tempDir,
        });
        expect(result3.decision).toEqual('allowed');

        // cleanup
        await fs.rm(tempDir, { recursive: true, force: true });
      });
    });
  });
});
