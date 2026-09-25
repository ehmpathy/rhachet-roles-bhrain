import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { given, then, when } from 'test-fns';

import { getSelfReviewTriggeredPaths } from './getSelfReviewTriggeredPaths';
import { setSelfReviewTriggeredReport } from './setSelfReviewTriggeredReport';

const sleep = (ms: number) => new Promise<void>((done) => setTimeout(done, ms));

/**
 * 🔴 .what = mints the ask, which every adjudication case now needs FIRST
 * .why = the adjudication path refuses an absent ask (`[case8]`) rather than mints one, so a
 *        case that promises with no ask no longer exercises the counter — it exercises the
 *        refusal. that is the production order too: `setStoneAsPassed` mints the ask, and a
 *        promise answers it.
 * .note = the mint leaves `attempts: 0`, so every extant count assertion below is unchanged.
 */
const setAsk = async (input: {
  stone: string;
  slug: string;
  route: string;
}): Promise<void> => {
  await setSelfReviewTriggeredReport(input, { sinceOnly: true });
};

/**
 * .what = probes whether a path is on disk, and allowlists ONLY a real absence
 * .why = a bare `.catch(() => false)` reads an EACCES or an EIO as "the file is not there",
 *        so a broken fixture renders as a clean assertion and the suite goes green on a
 *        machine where the operation never ran (rule.forbid.failhide)
 */
const isPathFound = (at: string): Promise<boolean> =>
  fs
    .access(at)
    .then(() => true)
    .catch((error: NodeJS.ErrnoException) => {
      if (error.code === 'ENOENT') return false;
      throw error;
    });

describe('setSelfReviewTriggeredReport', () => {
  given('[case1] .route directory does not yet found', () => {
    when('[t0] setSelfReviewTriggeredReport called', () => {
      const tempDir = path.join(
        os.tmpdir(),
        `test-set-triggered-${Date.now()}-1`,
      );

      then('creates .route directory and both marker files', async () => {
        await setAsk({ stone: '1.vision', slug: 'all-done', route: tempDir });
        const result = await setSelfReviewTriggeredReport({
          stone: '1.vision',
          slug: 'all-done',
          route: tempDir,
        });

        // verify .route dir created
        expect(await isPathFound(path.join(tempDir, '.route'))).toBe(true);

        // verify .since file created
        expect(await isPathFound(result.sincePath)).toBe(true);

        // verify .uptil file created
        expect(await isPathFound(result.uptilPath)).toBe(true);

        // cleanup
        await fs.rm(tempDir, { recursive: true, force: true });
      });

      then('returns both marker file paths and attempts', async () => {
        await setAsk({ stone: '1.vision', slug: 'all-done', route: tempDir });
        const result = await setSelfReviewTriggeredReport({
          stone: '1.vision',
          slug: 'all-done',
          route: tempDir,
        });

        // .note = the filename once carried the artifact hash. it carries (stone, slug)
        //         alone now, which is what makes a repair unable to reset the ask.
        expect(path.basename(result.sincePath)).toEqual(
          '1.vision.guard.selfreview.all-done.triggered.since',
        );
        expect(path.basename(result.uptilPath)).toEqual(
          '1.vision.guard.selfreview.all-done.triggered.uptil',
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

      /**
       * 🔴 .why = `.since` holds the slug and NAUGHT ELSE, and the two absences are each an
       *           assertion:
       *           - no `hash:` — a hash recorded here is a hash that can be compared, and a
       *             hash compared is the reset this round removed
       *           - no `attempts:` — the tally moved to `.attempts` at i013. while it lived
       *             here, every tally write rewrote the one file whose MTIME is a gate operand,
       *             and restored it with `fs.utimes`. that left a transient wrong mtime for a
       *             concurrent reader and a permanent one if the restore faulted
       *           ⇒ so a re-appearance of `attempts:` in this file is a REGRESSION of the i013
       *             repair, not a cosmetic drift, and this assertion is what catches it.
       */
      then('writes slug, and NO hash and NO tally, in .since', async () => {
        await setAsk({ stone: '1.vision', slug: 'all-done', route: tempDir });
        const result = await setSelfReviewTriggeredReport({
          stone: '1.vision',
          slug: 'all-done',
          route: tempDir,
        });

        const content = await fs.readFile(result.sincePath, 'utf-8');
        expect(content).toContain('slug: all-done');
        expect(content).not.toContain('hash:');
        expect(content).not.toContain('attempts:');

        // cleanup
        await fs.rm(tempDir, { recursive: true, force: true });
      });

      /**
       * 🔴 .why = the tally is still WRITTEN — it merely moved. an assertion that `.since` lacks
       *           it proves half the repair; this proves the other half, so the pair cannot be
       *           satisfied by a change that simply stopped to count.
       */
      then('writes the tally into .attempts instead', async () => {
        await setAsk({ stone: '1.vision', slug: 'all-done', route: tempDir });
        await setSelfReviewTriggeredReport({
          stone: '1.vision',
          slug: 'all-done',
          route: tempDir,
        });

        const { attemptsPath } = getSelfReviewTriggeredPaths({
          stone: '1.vision',
          slug: 'all-done',
          route: tempDir,
        });
        const content = await fs.readFile(attemptsPath, 'utf-8');
        expect(content).toContain('slug: all-done');
        expect(content).toContain('attempts: 1');

        // cleanup
        await fs.rm(tempDir, { recursive: true, force: true });
      });

      /**
       * 🔴 .why = the MTIME is the whole point of the split, so it is asserted directly rather
       *           than inferred from the file's bytes. a repair that moved the tally out and
       *           then still touched `.since` for any other reason would pass both assertions
       *           above and fail this one.
       */
      then(
        'leaves the ask mtime untouched across an adjudication',
        async () => {
          await setAsk({ stone: '1.vision', slug: 'all-done', route: tempDir });
          const { sincePath } = getSelfReviewTriggeredPaths({
            stone: '1.vision',
            slug: 'all-done',
            route: tempDir,
          });
          const mtimeAsked = (await fs.stat(sincePath)).mtime.getTime();

          await setSelfReviewTriggeredReport({
            stone: '1.vision',
            slug: 'all-done',
            route: tempDir,
          });

          const mtimeAfter = (await fs.stat(sincePath)).mtime.getTime();
          expect(mtimeAfter).toEqual(mtimeAsked);

          // cleanup
          await fs.rm(tempDir, { recursive: true, force: true });
        },
      );

      then('writes slug, and NO hash, in .uptil', async () => {
        await setAsk({ stone: '1.vision', slug: 'all-done', route: tempDir });
        const result = await setSelfReviewTriggeredReport({
          stone: '1.vision',
          slug: 'all-done',
          route: tempDir,
        });

        const content = await fs.readFile(result.uptilPath, 'utf-8');
        expect(content).toContain('slug: all-done');
        expect(content).not.toContain('hash:');

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
        await setAsk({ stone: '1.vision', slug: 'all-done', route: tempDir });
        const result = await setSelfReviewTriggeredReport({
          stone: '1.vision',
          slug: 'all-done',
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
          await setAsk({ stone: '1.vision', slug: 'all-done', route: tempDir });

          // first call
          const result1 = await setSelfReviewTriggeredReport({
            stone: '1.vision',
            slug: 'all-done',
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

  /**
   * .note = this case once read `[case5] three attempts on same hash`. the key is
   *         `(stone, slug)` now, so the qualifier is the slug, never the hash.
   */
  given('[case5] three attempts on one slug', () => {
    when('[t0] setSelfReviewTriggeredReport called 3x', () => {
      const tempDir = path.join(
        os.tmpdir(),
        `test-set-triggered-${Date.now()}-5`,
      );

      then('attempts increments to 3', async () => {
        await setAsk({ stone: '1.vision', slug: 'all-done', route: tempDir });
        const result1 = await setSelfReviewTriggeredReport({
          stone: '1.vision',
          slug: 'all-done',
          route: tempDir,
        });
        expect(result1.attempts).toEqual(1);

        const result2 = await setSelfReviewTriggeredReport({
          stone: '1.vision',
          slug: 'all-done',
          route: tempDir,
        });
        expect(result2.attempts).toEqual(2);

        const result3 = await setSelfReviewTriggeredReport({
          stone: '1.vision',
          slug: 'all-done',
          route: tempDir,
        });
        expect(result3.attempts).toEqual(3);

        // cleanup
        await fs.rm(tempDir, { recursive: true, force: true });
      });
    });
  });

  /**
   * .note = the ask is what the hand-out mints, once per unpromised review. it must leave
   *         `attempts` at 0 — that value is half the haste cue's condition — and it must be
   *         idempotent, so M lanes minted together all read the mtime the first mint wrote.
   */
  given('[case6] the ask — sinceOnly', () => {
    when('[t0] the ask is minted once', () => {
      const tempDir = path.join(
        os.tmpdir(),
        `test-set-triggered-${Date.now()}-6`,
      );

      then('attempts is 0, and .uptil is never written', async () => {
        const result = await setSelfReviewTriggeredReport(
          { stone: '1.vision', slug: 'all-done', route: tempDir },
          { sinceOnly: true },
        );

        expect(result.attempts).toEqual(0);

        // .why = a .uptil at the ask would read as a prior attempt on the first promise
        expect(await isPathFound(result.uptilPath)).toBe(false);

        // cleanup
        await fs.rm(tempDir, { recursive: true, force: true });
      });
    });

    when('[t1] the ask is re-minted after an adjudicated promise', () => {
      const tempDir = path.join(
        os.tmpdir(),
        `test-set-triggered-${Date.now()}-7`,
      );

      then('the mtime and the attempt count both hold', async () => {
        // the ask
        const asked = await setSelfReviewTriggeredReport(
          { stone: '1.vision', slug: 'all-done', route: tempDir },
          { sinceOnly: true },
        );
        const mtimeAtAsk = (await fs.stat(asked.sincePath)).mtime.getTime();

        await sleep(50);

        // an adjudicated promise
        const promised = await setSelfReviewTriggeredReport({
          stone: '1.vision',
          slug: 'all-done',
          route: tempDir,
        });
        expect(promised.attempts).toEqual(1);

        await sleep(50);

        // a re-ask — a no-op, so no lane can reset another lane's clock or count
        const reasked = await setSelfReviewTriggeredReport(
          { stone: '1.vision', slug: 'all-done', route: tempDir },
          { sinceOnly: true },
        );
        expect(reasked.attempts).toEqual(1);
        expect((await fs.stat(reasked.sincePath)).mtime.getTime()).toEqual(
          mtimeAtAsk,
        );

        // cleanup
        await fs.rm(tempDir, { recursive: true, force: true });
      });
    });
  });

  given('[case7] M lanes promise ONE slug in the same instant', () => {
    when('[t0] eight promises race with no await between them', () => {
      const tempDir = path.join(
        os.tmpdir(),
        `test-set-triggered-${Date.now()}-8`,
      );

      then('exactly one wins firstAdjudication', async () => {
        // .why = this is the clamp on the haste cue's "fires at most once per slug" bound.
        //        a read-then-decide on `attempts` cannot make that promise — two lanes can
        //        both read 0 — so the claim is an ATOMIC `wx` create, and the OS decides.
        //        ⚠️ revert that flag and this goes red at 8 winners, not 1.
        await setSelfReviewTriggeredReport(
          { stone: '1.vision', slug: 'all-done', route: tempDir },
          { sinceOnly: true },
        );

        const results = await Promise.all(
          Array.from({ length: 8 }, () =>
            setSelfReviewTriggeredReport({
              stone: '1.vision',
              slug: 'all-done',
              route: tempDir,
            }),
          ),
        );

        const winners = results.filter(
          (result) => result.firstAdjudication,
        ).length;
        expect(winners).toEqual(1);

        // cleanup
        await fs.rm(tempDir, { recursive: true, force: true });
      });
    });
  });

  /**
   * 🔴 .what = an adjudicated promise arrives with NO ask on record
   * .why = this branch MINTED a fresh `.since` dated now until i005, and the mint laundered
   *        the absent ask into a fabricated one: a pre-rewind articulation then read as fresh
   *        against a timestamp that postdates it. it was also the one non-atomic write left
   *        in this operation — a plain `writeFile` where the `sinceOnly` path uses `wx`.
   *
   * 🔴 .note = the repair DELETED the branch rather than made it atomic. a path reachable
   *            only when the precondition already failed should never run, never run safely.
   *            the caller returns `challenge:unasked` before it reaches here, so a throw is
   *            loud where the mint was silently wrong.
   */
  given('[case8] an adjudicated promise with no ask on record', () => {
    when('[t0] the report is set with no .since on disk', () => {
      const tempDir = path.join(
        os.tmpdir(),
        `test-set-triggered-${Date.now()}-8b`,
      );

      then('it throws rather than mints a fresh ask', async () => {
        await expect(
          setSelfReviewTriggeredReport({
            stone: '1.vision',
            slug: 'all-done',
            route: tempDir,
          }),
        ).rejects.toThrow('no ask on record');

        // cleanup
        await fs.rm(tempDir, { recursive: true, force: true });
      });

      /**
       * 🔴 the operand that clamps the LAUNDERING rather than the throw: a `.since` left on
       *    disk after the refusal is the fabricated ask itself, and it would read as a real
       *    ask — dated now — to every later gate
       */
      then('no .since is left behind by the refusal', async () => {
        const { sincePath } = getSelfReviewTriggeredPaths({
          stone: '1.vision',
          slug: 'all-done',
          route: tempDir,
        });

        await setSelfReviewTriggeredReport({
          stone: '1.vision',
          slug: 'all-done',
          route: tempDir,
        }).catch(() => undefined);

        expect(await isPathFound(sincePath)).toBe(false);

        // cleanup
        await fs.rm(tempDir, { recursive: true, force: true });
      });

      /**
       * 🔴 the operand that clamps the ORDER of the refusal, never merely its outcome.
       *    the throw sat BELOW the atomic `.uptil` claim until i006, so a refusal still
       *    wrote a marker — and a rewind that archived `.since` in that window left it
       *    behind as an ORPHAN: created after the archive walk, so never archived, and
       *    then read by the next ask's report as its own uptil mtime.
       *    ⇒ this goes red if the throw is ever moved back below the claim, which is the
       *      one edit that re-opens the leak while every other assertion here stays green
       */
      then('and no .uptil is left behind either', async () => {
        const { uptilPath } = getSelfReviewTriggeredPaths({
          stone: '1.vision',
          slug: 'all-done',
          route: tempDir,
        });

        await setSelfReviewTriggeredReport({
          stone: '1.vision',
          slug: 'all-done',
          route: tempDir,
        }).catch(() => undefined);

        expect(await isPathFound(uptilPath)).toBe(false);

        // cleanup
        await fs.rm(tempDir, { recursive: true, force: true });
      });
    });
  });

  /**
   * 🔴 .what = the diagnostic tally faults, and the verdict already won must still reach the caller
   * .why = the tally used to run inline BELOW the atomic `.uptil` claim, in the same failure
   *        domain. so a fault in it rejected the whole call AFTER `.uptil` was on disk: the
   *        caller received no verdict, and every retry then read `firstAdjudication: false`,
   *        because the claim had been won by a call that never returned.
   *        ⇒ **a fault in a value no gate reads would permanently disable the gate beside it.**
   *
   * .note = the fault is provoked DETERMINISTICALLY rather than mocked — a directory at the
   *         `.attempts` path throws `EISDIR` on `fs.readFile`, which is the exact shape of the
   *         hazard (the ask is intact, the tally's own storage is not).
   *
   * 🔴 .note = the fault MOVED with its subject at i013, and that is the point rather than an
   *            edit made in transit. it used to be provoked at `.since`, because the tally
   *            lived there — which is exactly the shared storage the i013 repair broke apart.
   *            a fixture left at `.since` would now fault the ASK and prove naught about the
   *            tally, so it was re-aimed at the file the tally actually writes.
   *
   * 🔴 .note = it bites. remove the catch in `setSelfReviewAttemptTally` and all three
   *            assertions below go red, because the call rejects rather than returns.
   */
  given('[case9] the ask is intact but the tally cannot be read', () => {
    when('[t0] an adjudicated promise is made', () => {
      const tempDir = path.join(
        os.tmpdir(),
        `test-set-triggered-${Date.now()}-9`,
      );

      const provokeFault = async (): Promise<void> => {
        await setAsk({ stone: '1.vision', slug: 'all-done', route: tempDir });
        const { attemptsPath } = getSelfReviewTriggeredPaths({
          stone: '1.vision',
          slug: 'all-done',
          route: tempDir,
        });
        // a directory is not an ENOENT, so it falls past the absent-tally arm and throws
        // EISDIR on `fs.readFile` — the fault the best-effort catch must report as null
        await fs.mkdir(attemptsPath, { recursive: true });
      };

      then('the first-ness verdict still reaches the caller', async () => {
        await provokeFault();

        const report = await setSelfReviewTriggeredReport({
          stone: '1.vision',
          slug: 'all-done',
          route: tempDir,
        });

        expect(report.firstAdjudication).toEqual(true);

        // cleanup
        await fs.rm(tempDir, { recursive: true, force: true });
      });

      /**
       * ⚠️ `null` says "the tally could not be raised", NEVER "zero attempts". a `0` here would
       *    report a fresh slug where the truth is an unreadable one
       */
      then('and the tally reports its own fault as null', async () => {
        await provokeFault();

        const report = await setSelfReviewTriggeredReport({
          stone: '1.vision',
          slug: 'all-done',
          route: tempDir,
        });

        expect(report.attempts).toEqual(null);

        // cleanup
        await fs.rm(tempDir, { recursive: true, force: true });
      });

      then('and the .uptil claim it won is on disk', async () => {
        await provokeFault();

        const { uptilPath } = getSelfReviewTriggeredPaths({
          stone: '1.vision',
          slug: 'all-done',
          route: tempDir,
        });

        await setSelfReviewTriggeredReport({
          stone: '1.vision',
          slug: 'all-done',
          route: tempDir,
        });

        expect(await isPathFound(uptilPath)).toBe(true);

        // cleanup
        await fs.rm(tempDir, { recursive: true, force: true });
      });
    });
  });
});
