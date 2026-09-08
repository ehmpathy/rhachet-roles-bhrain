import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { given, then, useBeforeAll, when } from 'test-fns';

import { enumRouteGuardReviewPeerFiles } from './enumRouteGuardReviewPeerFiles';

/**
 * 🔴 .note = this suite is MISCLASSIFIED. it is named `.test.ts` (unit) and it crosses
 *         the filesystem boundary in every case, which `rule.forbid.unit.remote-boundaries`
 *         grades a blocker. the misclassification predates this file's current cases —
 *         `[case1]` on origin/main already calls `fs.mkdtemp` — and ~44 unit suites in
 *         this repo share it.
 *
 *         it is NOT repaired here, and the reason is an ORDER, never a preference: a
 *         rename to `.integration.test.ts` moves this suite behind
 *         `jest.integration.env.ts:96`, which demands five brain keys of every
 *         integration suite. this suite calls no brain, so the rename would trade a
 *         correct label for a suite nobody can run — measured on the peer file
 *         `setStoneAsContemplated.integration.test.ts`, which is unrunnable locally today
 *         for exactly that reason.
 *
 *         ⇒ fix the harness first, then reclassify in one sweep:
 *         `.dream/v2026_09_04.fix.unit-suite-crosses-the-fs-boundary-repo-wide.md`
 */
describe('enumRouteGuardReviewPeerFiles', () => {
  given('[case1] route with no .reviews/peer/ directory', () => {
    const scene = useBeforeAll(async () => {
      const route = await fs.mkdtemp(path.join(os.tmpdir(), 'route-test-'));
      return { route };
    });

    when('[t0] called with stone filter', () => {
      then('returns empty array', async () => {
        const files = await enumRouteGuardReviewPeerFiles({
          route: scene.route,
          stone: '1.vision',
        });
        expect(files).toEqual([]);
      });
    });
  });

  given('[case2] route with empty .reviews/peer/ directory', () => {
    const scene = useBeforeAll(async () => {
      const route = await fs.mkdtemp(path.join(os.tmpdir(), 'route-test-'));
      await fs.mkdir(path.join(route, '.reviews', 'peer'), { recursive: true });
      return { route };
    });

    when('[t0] called with stone filter', () => {
      then('returns empty array', async () => {
        const files = await enumRouteGuardReviewPeerFiles({
          route: scene.route,
          stone: '1.vision',
        });
        expect(files).toEqual([]);
      });
    });
  });

  given('[case3] route with review files for different stones', () => {
    const scene = useBeforeAll(async () => {
      const route = await fs.mkdtemp(path.join(os.tmpdir(), 'route-test-'));
      const reviewsDir = path.join(route, '.reviews', 'peer');
      await fs.mkdir(reviewsDir, { recursive: true });

      // create reviews for different stones (zero-padded i/r grammar)
      const files = [
        '1.vision._.review.i001.abc123.r001._.given.by_peer.arch.md',
        '1.vision._.review.i002.def456.r001._.given.by_peer.arch.md',
        '2.plan._.review.i001.ghi789.r001._.given.by_peer.mech.md',
        '3.exec._.review.i001.jkl012.r001._.given.by_peer.ergo.md',
      ];
      for (const file of files) {
        await fs.writeFile(path.join(reviewsDir, file), '');
      }

      return { route, reviewsDir };
    });

    when('[t0] called with stone=1.vision', () => {
      then('returns only 1.vision files', async () => {
        const files = await enumRouteGuardReviewPeerFiles({
          route: scene.route,
          stone: '1.vision',
        });
        expect(files).toHaveLength(2);
        expect(files.every((f) => f.includes('1.vision'))).toBe(true);
      });
    });

    when('[t1] called with stone=2.plan', () => {
      then('returns only 2.plan files', async () => {
        const files = await enumRouteGuardReviewPeerFiles({
          route: scene.route,
          stone: '2.plan',
        });
        expect(files).toHaveLength(1);
        expect(files[0]).toContain('2.plan');
      });
    });

    when('[t2] called with stone=nonexistent', () => {
      then('returns empty array', async () => {
        const files = await enumRouteGuardReviewPeerFiles({
          route: scene.route,
          stone: 'nonexistent',
        });
        expect(files).toEqual([]);
      });
    });
  });

  given('[case4] route with multiple iterations, hashes, and indices', () => {
    const scene = useBeforeAll(async () => {
      const route = await fs.mkdtemp(path.join(os.tmpdir(), 'route-test-'));
      const reviewsDir = path.join(route, '.reviews', 'peer');
      await fs.mkdir(reviewsDir, { recursive: true });

      // create varied review files (zero-padded i/r grammar)
      const files = [
        // iteration 1, hash abc, reviewers 1 and 2
        '1.vision._.review.i001.abc123.r001._.given.by_peer.arch.md',
        '1.vision._.review.i001.abc123.r002._.given.by_peer.mech.md',
        // iteration 2, hash abc, reviewer 1
        '1.vision._.review.i002.abc123.r001._.given.by_peer.arch.md',
        // iteration 2, hash def, reviewer 1
        '1.vision._.review.i002.def456.r001._.given.by_peer.arch.md',
        // iteration 3, hash ghi, reviewers 1 and 2
        '1.vision._.review.i003.ghi789.r001._.given.by_peer.arch.md',
        '1.vision._.review.i003.ghi789.r002._.given.by_peer.mech.md',
      ];
      for (const file of files) {
        await fs.writeFile(path.join(reviewsDir, file), '');
      }

      return { route, reviewsDir };
    });

    when('[t0] called with only stone', () => {
      then('returns all files for that stone', async () => {
        const files = await enumRouteGuardReviewPeerFiles({
          route: scene.route,
          stone: '1.vision',
        });
        expect(files).toHaveLength(6);
      });
    });

    when('[t1] called with stone and iteration=1', () => {
      then('returns only iteration 1 files', async () => {
        const files = await enumRouteGuardReviewPeerFiles({
          route: scene.route,
          stone: '1.vision',
          iteration: 1,
        });
        expect(files).toHaveLength(2);
        expect(files.every((f) => f.includes('.i001.'))).toBe(true);
      });
    });

    when('[t2] called with stone and hash=abc123', () => {
      then('returns only files with that hash', async () => {
        const files = await enumRouteGuardReviewPeerFiles({
          route: scene.route,
          stone: '1.vision',
          hash: 'abc123',
        });
        expect(files).toHaveLength(3);
        expect(files.every((f) => f.includes('.abc123.'))).toBe(true);
      });
    });

    when('[t3] called with stone and index=2', () => {
      then('returns only reviewer 2 files', async () => {
        const files = await enumRouteGuardReviewPeerFiles({
          route: scene.route,
          stone: '1.vision',
          index: 2,
        });
        expect(files).toHaveLength(2);
        expect(files.every((f) => f.includes('.r002.'))).toBe(true);
      });
    });

    when('[t4] called with stone, iteration, and hash', () => {
      then('returns files that satisfy both criteria', async () => {
        const files = await enumRouteGuardReviewPeerFiles({
          route: scene.route,
          stone: '1.vision',
          iteration: 2,
          hash: 'abc123',
        });
        expect(files).toHaveLength(1);
        expect(files[0]).toContain('.i002.');
        expect(files[0]).toContain('.abc123.');
      });
    });

    when('[t5] called with stone, hash, and index', () => {
      then('returns files that satisfy all criteria', async () => {
        const files = await enumRouteGuardReviewPeerFiles({
          route: scene.route,
          stone: '1.vision',
          hash: 'ghi789',
          index: 2,
        });
        expect(files).toHaveLength(1);
        expect(files[0]).toContain('.ghi789.');
        expect(files[0]).toContain('.r002.');
      });
    });

    when('[t6] called with all filters', () => {
      then('returns files that satisfy all criteria', async () => {
        const files = await enumRouteGuardReviewPeerFiles({
          route: scene.route,
          stone: '1.vision',
          iteration: 1,
          hash: 'abc123',
          index: 1,
        });
        expect(files).toHaveLength(1);
        expect(files[0]).toContain('.i001.');
        expect(files[0]).toContain('.abc123.');
        expect(files[0]).toContain('.r001.');
      });
    });

    when('[t7] called with filters that have no results', () => {
      then('returns empty array', async () => {
        const files = await enumRouteGuardReviewPeerFiles({
          route: scene.route,
          stone: '1.vision',
          iteration: 99,
        });
        expect(files).toEqual([]);
      });
    });
  });

  given('[case5] route path does not exist', () => {
    when('[t0] called with nonexistent route', () => {
      then('returns empty array', async () => {
        const files = await enumRouteGuardReviewPeerFiles({
          route: '/nonexistent/path/to/route',
          stone: '1.vision',
        });
        expect(files).toEqual([]);
      });
    });
  });

  given('[case6] route with both given and taken files', () => {
    const scene = useBeforeAll(async () => {
      const route = await fs.mkdtemp(path.join(os.tmpdir(), 'route-test-'));
      const reviewsDir = path.join(route, '.reviews', 'peer');
      await fs.mkdir(reviewsDir, { recursive: true });

      const files = [
        '1.vision._.review.i001.abc123.r001._.given.by_peer.arch.md',
        '1.vision._.review.i001.abc123.r002._.given.by_peer.mech.md',
        '1.vision._.review.i001.abc123.r001._.taken.by_self.arch.md',
      ];
      for (const file of files) {
        await fs.writeFile(path.join(reviewsDir, file), '');
      }
      return { route };
    });

    when('[t0] called with kind=given', () => {
      then('returns only the given files', async () => {
        const files = await enumRouteGuardReviewPeerFiles({
          route: scene.route,
          stone: '1.vision',
          kind: 'given',
        });
        expect(files).toHaveLength(2);
        expect(files.every((f) => f.includes('_.given.by_peer.'))).toBe(true);
      });
    });

    when('[t1] called with kind=taken', () => {
      then('returns only the taken files', async () => {
        const files = await enumRouteGuardReviewPeerFiles({
          route: scene.route,
          stone: '1.vision',
          kind: 'taken',
        });
        expect(files).toHaveLength(1);
        expect(files[0]).toContain('_.taken.by_self.arch');
      });
    });

    when('[t2] called with no kind', () => {
      then('defaults to given (extant caller behavior)', async () => {
        const files = await enumRouteGuardReviewPeerFiles({
          route: scene.route,
          stone: '1.vision',
        });
        expect(files).toHaveLength(2);
        expect(files.every((f) => f.includes('_.given.by_peer.'))).toBe(true);
      });
    });
  });

  given('[case8] the shape of the paths that come back', () => {
    // every other case here asserts with .toContain / .includes, which pass whether
    // the path is absolute or route-relative. so the one contract BOTH consumers
    // lean on has never been stated: getAllRouteGuardReviewPeerGivens reads each
    // path bare, and answerEveryPeerGiven writes each derived path. one of those
    // is wrong unless the shape is pinned. globby is called with `absolute: true`
    // (enumFilesFromGlob:15) — this says so out loud, and proves it by USE.
    const scene = useBeforeAll(async () => {
      const route = await fs.mkdtemp(path.join(os.tmpdir(), 'route-test-'));
      const reviewsDir = path.join(route, '.reviews', 'peer');
      await fs.mkdir(reviewsDir, { recursive: true });
      await fs.writeFile(
        path.join(
          reviewsDir,
          '1.vision._.review.i001.abc123.r001._.given.by_peer.arch.md',
        ),
        'blockers: 1',
      );
      return { route };
    });

    when('[t0] a file is found', () => {
      then('its path is absolute, never route-relative', async () => {
        const files = await enumRouteGuardReviewPeerFiles({
          route: scene.route,
          stone: '1.vision',
        });
        expect(files).toHaveLength(1);
        expect(path.isAbsolute(files[0]!)).toBe(true);
      });
    });

    when('[t1] a consumer reads that path with no join', () => {
      then('the read succeeds — a join would be a defect', async () => {
        const files = await enumRouteGuardReviewPeerFiles({
          route: scene.route,
          stone: '1.vision',
        });
        // the read getAllRouteGuardReviewPeerGivens performs, verbatim
        expect(await fs.readFile(files[0]!, 'utf-8')).toEqual('blockers: 1');
      });
    });

    when('[t2] a consumer joins the route onto that path', () => {
      then(
        'the join corrupts it, so a consumer must read the path bare',
        async () => {
          // 🔴 asserted against the REAL enumerated path, never a fabricated one.
          //    an earlier form joined a hardcoded '/a/b.md' and so pinned node's
          //    path.join contract — true, and it could never go red on a defect in
          //    this repo. keyed to the enumerator's own output it bites: were the
          //    enumerator to start returning route-relative paths, the join below
          //    would point at a real file and the read would succeed
          //    (r4 nitpick.2, i002)
          const files = await enumRouteGuardReviewPeerFiles({
            route: scene.route,
            stone: '1.vision',
          });
          const joined = path.join(scene.route, files[0]!);

          expect(joined).not.toEqual(files[0]!);
          await expect(fs.readFile(joined, 'utf-8')).rejects.toThrow();
        },
      );
    });
  });

  given('[case7] a given file with an adjacent .report.md', () => {
    const scene = useBeforeAll(async () => {
      const route = await fs.mkdtemp(path.join(os.tmpdir(), 'route-test-'));
      const reviewsDir = path.join(route, '.reviews', 'peer');
      await fs.mkdir(reviewsDir, { recursive: true });

      const files = [
        '1.vision._.review.i001.abc123.r001._.given.by_peer.arch.md',
        '1.vision._.review.i001.abc123.r001._.given.by_peer.arch.report.md',
      ];
      for (const file of files) {
        await fs.writeFile(path.join(reviewsDir, file), '');
      }
      return { route };
    });

    when('[t0] called with kind=given', () => {
      then('excludes the .report.md and returns only the given', async () => {
        const files = await enumRouteGuardReviewPeerFiles({
          route: scene.route,
          stone: '1.vision',
          kind: 'given',
        });
        expect(files).toHaveLength(1);
        expect(files[0]).toContain('_.given.by_peer.arch.md');
        expect(files.some((f) => f.endsWith('.report.md'))).toBe(false);
      });
    });
  });
});
