import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { given, then, useBeforeAll, when } from 'test-fns';

import { enumRouteGuardReviewPeerFiles } from './enumRouteGuardReviewPeerFiles';

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
