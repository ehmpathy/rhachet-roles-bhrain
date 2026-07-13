import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { given, then, useBeforeAll, when } from 'test-fns';

import { RouteStone } from '@src/domain.objects/Driver/RouteStone';

import { computeStoneReviewInputHash } from './computeStoneReviewInputHash';

const ASSETS_DIR = path.join(__dirname, '../.test/assets');

describe('computeStoneReviewInputHash', () => {
  given('[case1] stone without guard in route.approved', () => {
    const routePath = path.join(ASSETS_DIR, 'route.approved');
    const stone = new RouteStone({
      name: '1.vision',
      path: path.join(routePath, '1.vision.stone'),
      guard: null,
    });

    when('[t0] hash is computed', () => {
      then('returns 18-char hex hash', async () => {
        const hash = await computeStoneReviewInputHash({
          stone,
          route: routePath,
        });
        expect(hash).toBeDefined();
        expect(hash.length).toBe(18);
        expect(hash).toMatch(/^[0-9a-f]{18}$/);
      });

      then('returns deterministic hash', async () => {
        const hash1 = await computeStoneReviewInputHash({
          stone,
          route: routePath,
        });
        const hash2 = await computeStoneReviewInputHash({
          stone,
          route: routePath,
        });
        expect(hash1).toEqual(hash2);
      });
    });
  });

  given('[case2] stone with guard artifacts in a temp route', () => {
    // hermetic route: a small fixture artifact set. the prior form globbed the
    // real repo `src/**/*.ts` and git-hashed every dirty file, so it timed out
    // on a busy worktree — a flake. a $route-scoped fixture makes the hash
    // depend only on the fixture, so it is fast and deterministic regardless of
    // worktree state. intent preserved: hash derived from guard artifacts.
    const scene = useBeforeAll(async () => {
      const routePath = await fs.mkdtemp(
        path.join(os.tmpdir(), 'compute-hash-artifacts-'),
      );
      const srcDir = path.join(routePath, 'src');
      await fs.mkdir(srcDir, { recursive: true });
      await fs.writeFile(path.join(srcDir, 'a.ts'), 'export const a = 1;\n');
      await fs.writeFile(path.join(srcDir, 'b.ts'), 'export const b = 2;\n');

      const stone = new RouteStone({
        name: '1.implement',
        path: path.join(routePath, '1.implement.stone'),
        guard: {
          path: path.join(routePath, '1.implement.guard'),
          artifacts: ['$route/src/**/*.ts'],
          reviews: { self: [], peer: [] },
          judges: [],
          protect: [],
        },
      });

      const hash = await computeStoneReviewInputHash({
        stone,
        route: routePath,
      });
      return { routePath, hash };
    });

    afterAll(async () => {
      await fs.rm(scene.routePath, { recursive: true, force: true });
    });

    when('[t0] hash is computed', () => {
      then('returns 18-char hex hash based on guard artifacts', () => {
        expect(scene.hash).toBeDefined();
        expect(scene.hash.length).toBe(18);
        expect(scene.hash).toMatch(/^[0-9a-f]{18}$/);
      });
    });
  });
});
