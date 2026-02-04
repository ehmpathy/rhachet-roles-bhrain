import * as path from 'path';
import { given, then, when } from 'test-fns';

import { RouteStone } from '@src/domain.objects/Driver/RouteStone';

import { getAllStoneArtifacts } from './getAllStoneArtifacts';

const ASSETS_DIR = path.join(__dirname, '../.test/assets');

describe('getAllStoneArtifacts', () => {
  given('[case1] stone without guard in route.simple', () => {
    const routePath = path.join(ASSETS_DIR, 'route.simple');
    const stone = new RouteStone({
      name: '1.vision',
      path: path.join(routePath, '1.vision.stone'),
      guard: null,
    });

    when('[t0] no artifact file found', () => {
      then('returns empty array', async () => {
        const artifacts = await getAllStoneArtifacts({
          stone,
          route: routePath,
        });
        expect(artifacts).toHaveLength(0);
      });
    });
  });

  given('[case2] stone without guard in route.approved', () => {
    const routePath = path.join(ASSETS_DIR, 'route.approved');
    const stone = new RouteStone({
      name: '1.vision',
      path: path.join(routePath, '1.vision.stone'),
      guard: null,
    });

    when('[t0] artifact file found', () => {
      then('returns array with matched file', async () => {
        const artifacts = await getAllStoneArtifacts({
          stone,
          route: routePath,
        });
        expect(artifacts.length).toBeGreaterThan(0);
        expect(artifacts[0]).toContain('1.vision');
        expect(artifacts[0]).toContain('.md');
      });
    });
  });

  given('[case3] stone with guard that specifies artifacts', () => {
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

    when('[t0] guard artifacts glob matches files', () => {
      then('returns array with matched files', async () => {
        const artifacts = await getAllStoneArtifacts({
          stone,
          route: routePath,
        });
        expect(artifacts.length).toBeGreaterThan(0);
        expect(artifacts.some((a) => a.includes('clean.ts'))).toBe(true);
        expect(artifacts.some((a) => a.includes('dirty.ts'))).toBe(true);
      });
    });
  });
});
