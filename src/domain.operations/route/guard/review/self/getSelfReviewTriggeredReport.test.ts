import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { given, then, when } from 'test-fns';

import { getSelfReviewTriggeredPaths } from './getSelfReviewTriggeredPaths';
import { getSelfReviewTriggeredReport } from './getSelfReviewTriggeredReport';
import { setSelfReviewTriggeredReport } from './setSelfReviewTriggeredReport';

/**
 * 🔴 .what = mints the ask, then adjudicates a promise against it
 * .why = the adjudication path refuses an absent ask rather than mints one, so a fixture
 *        that promises with no ask now throws. this is the production order too:
 *        `setStoneAsPassed` mints the ask, and a promise answers it.
 * .note = the mint leaves `attempts: 0`, so every count assertion below is unchanged — the
 *         first adjudication still reads 1.
 */
const setAskedThenPromised = async (input: {
  stone: string;
  slug: string;
  route: string;
}): Promise<void> => {
  await setSelfReviewTriggeredReport(input, { sinceOnly: true });
  await setSelfReviewTriggeredReport(input);
};

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

      then('returns sinceMtime and attempts from the ask marker', async () => {
        // create marker files
        await setAskedThenPromised({
          stone: '1.vision',
          slug: 'all-done',
          route: tempDir,
        });

        // get report
        const result = await getSelfReviewTriggeredReport({
          stone: '1.vision',
          slug: 'all-done',
          route: tempDir,
        });

        // verify result
        expect(result).not.toBeNull();
        expect(result?.sinceMtime.getTime()).toBeGreaterThan(0);
        expect(result?.attempts).toEqual(1);

        // cleanup
        await fs.rm(tempDir, { recursive: true, force: true });
      });
    });
  });

  /**
   * .note = this case once read `[case3] hash mismatch` and asserted that a second hash
   *         returned null. the key is `(stone, slug)` now, so that discrimination is
   *         retired BY DESIGN — it is what reset the clock on every repair.
   *         the case is re-aimed at the discrimination that remains, never deleted.
   */
  given('[case3] the key discriminates on slug alone', () => {
    when('[t0] a marker file was created for one slug', () => {
      const tempDir = path.join(
        os.tmpdir(),
        `test-get-triggered-${Date.now()}-3`,
      );

      then('a peer slug reads null; the named slug reads its own', async () => {
        // create the marker for one slug
        await setAskedThenPromised({
          stone: '1.vision',
          slug: 'all-done',
          route: tempDir,
        });

        // a peer slug has no marker of its own
        const resultOther = await getSelfReviewTriggeredReport({
          stone: '1.vision',
          slug: 'has-questioned-assumptions',
          route: tempDir,
        });
        expect(resultOther).toBeNull();

        // the named slug reads the marker it minted
        const resultSame = await getSelfReviewTriggeredReport({
          stone: '1.vision',
          slug: 'all-done',
          route: tempDir,
        });
        expect(resultSame).not.toBeNull();

        // cleanup
        await fs.rm(tempDir, { recursive: true, force: true });
      });
    });
  });

  /**
   * 🔴 .note = this case once read `[case4] .uptil absent (graceful fallback)` and asserted
   *            `uptilMtime equals sinceMtime`. the report returns no `uptilMtime` as of
   *            2026-09-20 — no gate ever read it, and it was a vestige of the clock design
   *            this round retired. ⇒ the case is RE-AIMED at the property that remains and
   *            still matters: the report must survive a `.uptil` that is absent, which is
   *            the ordinary state of every fresh ask (`sinceOnly` mints it not at all).
   * .note = re-aimed rather than deleted — its subject (the absent `.uptil`) is live; only
   *         the quantity it asserted about is gone. a case deleted with a live subject is
   *         a coverage gap, whatever its old assertion said
   */
  given('[case4] .uptil absent — the ordinary state of a fresh ask', () => {
    when('[t0] only the .since marker found', () => {
      const tempDir = path.join(
        os.tmpdir(),
        `test-get-triggered-${Date.now()}-4`,
      );

      then('the report still reads, off .since alone', async () => {
        // mint the ask only — sinceOnly leaves .uptil absent by design
        await setSelfReviewTriggeredReport(
          { stone: '1.vision', slug: 'all-done', route: tempDir },
          { sinceOnly: true },
        );

        // get report
        const result = await getSelfReviewTriggeredReport({
          stone: '1.vision',
          slug: 'all-done',
          route: tempDir,
        });

        // the ask's mtime is what the haste cue and the freshness bar both read
        expect(result).not.toBeNull();
        expect(result?.sinceMtime.getTime()).toBeGreaterThan(0);
        // and no attempt is burned by the ask itself
        expect(result?.attempts).toEqual(0);

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
        await setSelfReviewTriggeredReport(
          { stone: '1.vision', slug: 'all-done', route: tempDir },
          { sinceOnly: true },
        );
        await setSelfReviewTriggeredReport({
          stone: '1.vision',
          slug: 'all-done',
          route: tempDir,
        });
        await setSelfReviewTriggeredReport({
          stone: '1.vision',
          slug: 'all-done',
          route: tempDir,
        });
        await setSelfReviewTriggeredReport({
          stone: '1.vision',
          slug: 'all-done',
          route: tempDir,
        });

        // get report
        const result = await getSelfReviewTriggeredReport({
          stone: '1.vision',
          slug: 'all-done',
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

  /**
   * 🔴 .note = `null` means ABSENT, and it may never mean UNREADABLE.
   *
   *   the two are conflated by a bare catch, and the conflation OPENS THE GATE: a null report
   *   makes `getSelfReviewChallengeDecision`'s elapsed read as Infinity (so the haste cue cannot
   *   fire) and skips the freshness bar entirely (so a stale articulation clears). ⇒ a
   *   permission fault, or an EMFILE under a fork of M lanes, would silently turn a gate into a
   *   pass — `rule.forbid.failhide`, in the one operation the whole gate reads.
   *
   *   a directory at the marker's path is the portable way to construct a non-ENOENT error:
   *   `fs.stat` succeeds on a directory and `fs.readFile` raises EISDIR.
   */
  given('[case6] the marker path is UNREADABLE rather than absent', () => {
    when('[t0] a directory sits where the .since marker belongs', () => {
      const tempDir = path.join(
        os.tmpdir(),
        `test-get-triggered-${Date.now()}-6`,
      );

      then('it throws, and never reads as "no ask on record"', async () => {
        // place a directory at the exact path the marker is owed at
        const { sincePath } = getSelfReviewTriggeredPaths({
          stone: '1.vision',
          slug: 'all-done',
          route: tempDir,
        });
        await fs.mkdir(sincePath, { recursive: true });

        // the fault must surface, never come back as a null report
        await expect(
          getSelfReviewTriggeredReport({
            stone: '1.vision',
            slug: 'all-done',
            route: tempDir,
          }),
        ).rejects.toThrow();

        // cleanup
        await fs.rm(tempDir, { recursive: true, force: true });
      });
    });
  });
});
