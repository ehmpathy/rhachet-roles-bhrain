import * as path from 'path';
import { given, then, when } from 'test-fns';

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
      then('returns non-empty hash string', async () => {
        const hash = await computeStoneReviewInputHash({
          stone,
          route: routePath,
        });
        expect(hash).toBeDefined();
        expect(hash.length).toBeGreaterThan(0);
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

  given('[case2] stone with guard in route.reviewed', () => {
    const routePath = path.join(ASSETS_DIR, 'route.reviewed');
    const stone = new RouteStone({
      name: '1.implement',
      path: path.join(routePath, '1.implement.stone'),
      guard: {
        path: path.join(routePath, '1.implement.guard'),
        artifacts: ['src/**/*.ts'],
        reviews: [],
        judges: [],
      },
    });

    when('[t0] hash is computed', () => {
      then('returns hash based on guard artifacts', async () => {
        const hash = await computeStoneReviewInputHash({
          stone,
          route: routePath,
        });
        expect(hash).toBeDefined();
        expect(hash.length).toBeGreaterThan(0);
      });
    });
  });
});
