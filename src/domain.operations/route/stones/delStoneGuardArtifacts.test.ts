import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { given, then, when } from 'test-fns';

import { delStoneGuardArtifacts } from './delStoneGuardArtifacts';

describe('delStoneGuardArtifacts', () => {
  given('[case1] a stone with no guard artifacts', () => {
    const tempDir = path.join(
      os.tmpdir(),
      `test-del-guard-artifacts-empty-${Date.now()}`,
    );

    beforeEach(async () => {
      await fs.mkdir(path.join(tempDir, '.route'), { recursive: true });
    });

    afterEach(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    when('[t0] delStoneGuardArtifacts is called', () => {
      then('returns zero counts', async () => {
        const result = await delStoneGuardArtifacts({
          stone: '1.vision',
          route: tempDir,
        });
        expect(result).toEqual({
          reviews: 0,
          judges: 0,
          promises: 0,
          triggers: { blocked: 0, selfReviews: 0 },
        });
      });
    });
  });

  given('[case2] a stone with review artifacts', () => {
    const tempDir = path.join(
      os.tmpdir(),
      `test-del-guard-artifacts-reviews-${Date.now()}`,
    );
    const reviewsDir = path.join(tempDir, '.reviews', 'peer');

    beforeEach(async () => {
      await fs.mkdir(reviewsDir, { recursive: true });
      await fs.writeFile(
        path.join(
          reviewsDir,
          '1.vision._.review.i001.abc123.r001._.given.by_peer.test-reviewer.md',
        ),
        'review 1',
      );
      await fs.writeFile(
        path.join(
          reviewsDir,
          '1.vision._.review.i001.abc123.r002._.given.by_peer.test-reviewer.md',
        ),
        'review 2',
      );
    });

    afterEach(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    when('[t0] delStoneGuardArtifacts is called', () => {
      then('deletes review files', async () => {
        await delStoneGuardArtifacts({ stone: '1.vision', route: tempDir });

        const files = await fs.readdir(reviewsDir);
        expect(files.filter((f) => f.includes('.review.'))).toHaveLength(0);
      });

      then('returns correct review count', async () => {
        const result = await delStoneGuardArtifacts({
          stone: '1.vision',
          route: tempDir,
        });
        expect(result.reviews).toBe(2);
      });
    });
  });

  given('[case3] a stone with judge artifacts', () => {
    const tempDir = path.join(
      os.tmpdir(),
      `test-del-guard-artifacts-judges-${Date.now()}`,
    );
    const routeDir = path.join(tempDir, '.route');

    beforeEach(async () => {
      await fs.mkdir(routeDir, { recursive: true });
      await fs.writeFile(
        path.join(routeDir, '1.vision.guard.judge.i1.abc123.j1.md'),
        'judge 1',
      );
    });

    afterEach(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    when('[t0] delStoneGuardArtifacts is called', () => {
      then('deletes judge files', async () => {
        await delStoneGuardArtifacts({ stone: '1.vision', route: tempDir });

        const files = await fs.readdir(routeDir);
        expect(files.filter((f) => f.includes('.judge.'))).toHaveLength(0);
      });

      then('returns correct judge count', async () => {
        const result = await delStoneGuardArtifacts({
          stone: '1.vision',
          route: tempDir,
        });
        expect(result.judges).toBe(1);
      });
    });
  });

  given('[case4] a stone with promise artifacts', () => {
    const tempDir = path.join(
      os.tmpdir(),
      `test-del-guard-artifacts-promises-${Date.now()}`,
    );
    const routeDir = path.join(tempDir, '.route');

    beforeEach(async () => {
      await fs.mkdir(routeDir, { recursive: true });
      await fs.writeFile(
        path.join(routeDir, '1.vision.guard.promise.i1.p1.md'),
        'promise 1',
      );
    });

    afterEach(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    when('[t0] delStoneGuardArtifacts is called', () => {
      then('deletes promise files', async () => {
        await delStoneGuardArtifacts({ stone: '1.vision', route: tempDir });

        const files = await fs.readdir(routeDir);
        expect(files.filter((f) => f.includes('.promise.'))).toHaveLength(0);
      });

      then('returns correct promise count', async () => {
        const result = await delStoneGuardArtifacts({
          stone: '1.vision',
          route: tempDir,
        });
        expect(result.promises).toBe(1);
      });
    });
  });

  given('[case5] a stone with triggered artifacts', () => {
    const tempDir = path.join(
      os.tmpdir(),
      `test-del-guard-artifacts-triggers-${Date.now()}`,
    );
    const routeDir = path.join(tempDir, '.route');

    beforeEach(async () => {
      await fs.mkdir(routeDir, { recursive: true });
      await fs.writeFile(
        path.join(
          routeDir,
          '1.vision.guard.selfreview.i1.triggered.2024-01-01T12-00-00.md',
        ),
        'trigger 1',
      );
    });

    afterEach(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    when('[t0] delStoneGuardArtifacts is called', () => {
      then('deletes triggered files', async () => {
        await delStoneGuardArtifacts({ stone: '1.vision', route: tempDir });

        const files = await fs.readdir(routeDir);
        expect(files.filter((f) => f.includes('.triggered.'))).toHaveLength(0);
      });

      then('returns correct trigger count', async () => {
        const result = await delStoneGuardArtifacts({
          stone: '1.vision',
          route: tempDir,
        });
        expect(result.triggers.selfReviews).toBe(1);
      });
    });
  });

  given('[case6] a stone with mixed artifacts', () => {
    const tempDir = path.join(
      os.tmpdir(),
      `test-del-guard-artifacts-mixed-${Date.now()}`,
    );
    const routeDir = path.join(tempDir, '.route');
    const reviewsDir = path.join(tempDir, '.reviews', 'peer');

    beforeEach(async () => {
      await fs.mkdir(routeDir, { recursive: true });
      await fs.mkdir(reviewsDir, { recursive: true });
      // reviews go to .reviews/peer/
      await fs.writeFile(
        path.join(
          reviewsDir,
          '1.vision._.review.i001.abc123.r001._.given.by_peer.test-reviewer.md',
        ),
        'review',
      );
      // judges, promises, triggers stay in .route/
      await fs.writeFile(
        path.join(routeDir, '1.vision.guard.judge.i1.abc123.j1.md'),
        'judge',
      );
      await fs.writeFile(
        path.join(routeDir, '1.vision.guard.promise.i1.p1.md'),
        'promise',
      );
      await fs.writeFile(
        path.join(
          routeDir,
          '1.vision.guard.selfreview.i1.triggered.2024-01-01T12-00-00.md',
        ),
        'trigger',
      );
    });

    afterEach(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    when('[t0] delStoneGuardArtifacts is called', () => {
      /**
       * .note = this once asserted an empty `.route/`. the rewind ARCHIVES the self-review
       *         triggers now rather than deletes them — the marker's mtime is the only
       *         record of when a review was asked for, and the freshness bar reads it.
       *         the case is re-aimed at the move, never deleted: it still proves no guard
       *         artifact is left in place, and now also proves the trigger survives.
       */
      then(
        'clears every guard artifact, and archives the triggers',
        async () => {
          await delStoneGuardArtifacts({ stone: '1.vision', route: tempDir });

          const routeFiles = await fs.readdir(routeDir);
          expect(routeFiles).toEqual(['.archive']);
          const reviewFiles = await fs.readdir(reviewsDir);
          expect(reviewFiles).toHaveLength(0);

          // the trigger was moved, never destroyed
          const archived = await fs.readdir(path.join(routeDir, '.archive'));
          expect(archived).toEqual([
            '1.vision.guard.selfreview.i1.triggered.2024-01-01T12-00-00.md',
          ]);
        },
      );

      then('returns correct counts for all types', async () => {
        const result = await delStoneGuardArtifacts({
          stone: '1.vision',
          route: tempDir,
        });
        expect(result).toEqual({
          reviews: 1,
          judges: 1,
          promises: 1,
          triggers: { blocked: 0, selfReviews: 1 },
        });
      });
    });
  });

  given('[case7] no .route directory', () => {
    const tempDir = path.join(
      os.tmpdir(),
      `test-del-guard-artifacts-noroute-${Date.now()}`,
    );

    beforeEach(async () => {
      await fs.mkdir(tempDir, { recursive: true });
    });

    afterEach(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    when('[t0] delStoneGuardArtifacts is called', () => {
      then('returns zero counts gracefully', async () => {
        const result = await delStoneGuardArtifacts({
          stone: '1.vision',
          route: tempDir,
        });
        expect(result).toEqual({
          reviews: 0,
          judges: 0,
          promises: 0,
          triggers: { blocked: 0, selfReviews: 0 },
        });
      });
    });
  });

  given('[case8] artifacts for other stones are preserved', () => {
    const tempDir = path.join(
      os.tmpdir(),
      `test-del-guard-artifacts-preserve-${Date.now()}`,
    );
    const reviewsDir = path.join(tempDir, '.reviews', 'peer');

    beforeEach(async () => {
      await fs.mkdir(reviewsDir, { recursive: true });
      await fs.writeFile(
        path.join(
          reviewsDir,
          '1.vision._.review.i001.abc123.r001._.given.by_peer.test-reviewer.md',
        ),
        'review for 1.vision',
      );
      await fs.writeFile(
        path.join(
          reviewsDir,
          '2.criteria._.review.i001.def456.r001._.given.by_peer.test-reviewer.md',
        ),
        'review for 2.criteria',
      );
    });

    afterEach(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    when('[t0] delStoneGuardArtifacts is called for 1.vision', () => {
      then('only deletes 1.vision artifacts', async () => {
        await delStoneGuardArtifacts({ stone: '1.vision', route: tempDir });

        const files = await fs.readdir(reviewsDir);
        expect(files).toHaveLength(1);
        expect(files[0]).toContain('2.criteria');
      });
    });
  });

  given('[case9] artifacts in directory with gitignore (regression)', () => {
    const tempDir = path.join(
      os.tmpdir(),
      `test-del-guard-artifacts-gitignore-${Date.now()}`,
    );
    const routeDir = path.join(tempDir, '.route');
    const reviewsDir = path.join(tempDir, '.reviews', 'peer');

    beforeEach(async () => {
      await fs.mkdir(routeDir, { recursive: true });
      await fs.mkdir(reviewsDir, { recursive: true });
      // create .gitignore that ignores all files
      await fs.writeFile(path.join(routeDir, '.gitignore'), '*\n');
      await fs.writeFile(path.join(reviewsDir, '.gitignore'), '*\n');
      // create guard artifacts (would be gitignored in production)
      await fs.writeFile(
        path.join(
          reviewsDir,
          '1.vision._.review.i001.abc123.r001._.given.by_peer.test-reviewer.md',
        ),
        'review',
      );
      await fs.writeFile(
        path.join(routeDir, '1.vision.guard.judge.i1.abc123.j1.md'),
        'judge',
      );
    });

    afterEach(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    when('[t0] delStoneGuardArtifacts is called', () => {
      then('finds and deletes gitignored artifacts', async () => {
        const result = await delStoneGuardArtifacts({
          stone: '1.vision',
          route: tempDir,
        });
        // the fix ensures these are found even with .gitignore present
        expect(result.reviews).toBe(1);
        expect(result.judges).toBe(1);
      });

      then('files are actually deleted', async () => {
        await delStoneGuardArtifacts({ stone: '1.vision', route: tempDir });

        const routeFiles = await fs.readdir(routeDir);
        const guardFiles = routeFiles.filter((f) => f.includes('.guard.'));
        expect(guardFiles).toHaveLength(0);

        const reviewFiles = await fs.readdir(reviewsDir);
        const reviewArtifacts = reviewFiles.filter((f) =>
          f.includes('.review.'),
        );
        expect(reviewArtifacts).toHaveLength(0);
      });
    });
  });

  given('[case10] a stone with blocked trigger file', () => {
    const tempDir = path.join(
      os.tmpdir(),
      `test-del-guard-artifacts-blocked-${Date.now()}`,
    );
    const routeDir = path.join(tempDir, '.route');

    beforeEach(async () => {
      await fs.mkdir(routeDir, { recursive: true });
      await fs.writeFile(path.join(routeDir, '1.vision.blocked.triggered'), '');
    });

    afterEach(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    when('[t0] delStoneGuardArtifacts is called', () => {
      then('deletes blocked trigger file', async () => {
        await delStoneGuardArtifacts({ stone: '1.vision', route: tempDir });

        const files = await fs.readdir(routeDir);
        expect(
          files.filter((f) => f.includes('.blocked.triggered')),
        ).toHaveLength(0);
      });

      then('returns correct blocked trigger count', async () => {
        const result = await delStoneGuardArtifacts({
          stone: '1.vision',
          route: tempDir,
        });
        expect(result.triggers.blocked).toBe(1);
      });
    });
  });

  /**
   * .why = every other trigger case here writes a `…triggered.<stamp>.md` fixture, and the code
   *        writes no such file. it writes `.since` and `.uptil`, and a route that was mid-flight
   *        when the hash key was retired also carries the legacy `…<slug>.<hash>.triggered.since`
   *        shape. so the archive was verified only against a fixture chosen to match the glob.
   *
   *        that is the EXACT defect the rewind already suffered once: the extant cleanup globbed
   *        `…triggered.*.md`, matched zero real markers, and stayed green because no marker with
   *        a `.md` suffix was ever written for it to miss. ⇒ a fixture that does not match what
   *        the code produces cannot fail, whatever the glob does.
   */
  given('[case11] the trigger marker shapes the code ACTUALLY writes', () => {
    const tempDir = path.join(
      os.tmpdir(),
      `test-del-guard-artifacts-real-markers-${Date.now()}`,
    );
    const routeDir = path.join(tempDir, '.route');

    beforeEach(async () => {
      await fs.mkdir(routeDir, { recursive: true });
      // the hashless pair the current code mints
      await fs.writeFile(
        path.join(
          routeDir,
          '1.vision.guard.selfreview.tests-pass.triggered.since',
        ),
        '',
      );
      await fs.writeFile(
        path.join(
          routeDir,
          '1.vision.guard.selfreview.tests-pass.triggered.uptil',
        ),
        '',
      );
      // the legacy hashed shape, left by a route that was mid-flight at the retirement
      await fs.writeFile(
        path.join(
          routeDir,
          '1.vision.guard.selfreview.all-done.b90fcb7c.triggered.since',
        ),
        '',
      );
    });

    afterEach(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    when('[t0] the rewind runs', () => {
      then('every marker is archived — hashless and legacy alike', async () => {
        await delStoneGuardArtifacts({ stone: '1.vision', route: tempDir });

        const routeFiles = await fs.readdir(routeDir);
        expect(routeFiles).toEqual(['.archive']);

        const archived = await fs.readdir(path.join(routeDir, '.archive'));
        expect(archived.sort()).toEqual([
          '1.vision.guard.selfreview.all-done.b90fcb7c.triggered.since',
          '1.vision.guard.selfreview.tests-pass.triggered.since',
          '1.vision.guard.selfreview.tests-pass.triggered.uptil',
        ]);
      });

      /**
       * .why = the count is what the emit reports to the driver. a glob that matched the
       *        `.since` and missed the `.uptil` would leave a live `.uptil` behind AND report
       *        a tidy number, so the count is the half a reader would trust.
       *
       * 🔴 .note = this comment used to DISAMBIGUATE the field, because `triggers.promises`
       *            was the self-review TRIGGER count while the `promises` at the top level is
       *            the promise-FILE count — two concepts, one word, in one return shape. it
       *            cost a misread while this very case was authored, and was then deferred
       *            here as "flagged rather than renamed: the shape is extant and has callers".
       *            ⇒ that deferral was wrong on its own terms: the callers were three files,
       *            all already open in the round's diff. renamed 2026-09-20 to
       *            `triggers.selfReviews` / `triggers.blocked`, which name the MARKER kind.
       * .note = a name that needs a paragraph to say which concept it carries IS the overload
       *         (rule.forbid.domain-term-ambiguity) — so the retirement of that paragraph is
       *         the clearest evidence the rename was the right repair
       */
      then('the count matches the markers moved', async () => {
        const result = await delStoneGuardArtifacts({
          stone: '1.vision',
          route: tempDir,
        });
        expect(result.triggers.selfReviews).toEqual(3);
        // and the promise-FILE count is a separate quantity: no promise file was written here
        expect(result.promises).toEqual(0);
      });
    });
  });
});
