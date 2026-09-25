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

  /**
   * 🔴 .why = the default branch reaches for TWO globs, and in every other fixture the legacy
   *           one MASKS the yield one: a `1.vision.<x>.md` satisfies `$stone*.md`, so a break
   *           in `$stone.yield*` still returns a file and the suite stays green.
   * 🔴 .how it was found = the yield glob was extracted to one owner
   *           (`getStoneYieldGlob`), then deliberately broken to check the readers bite.
   *           `archiveStoneYield` went red at 11 cases; THIS suite stayed green. the callers
   *           route correctly and the coverage was absent — a distinction only the bite check
   *           renders (`rule.require.clamp-edge-cases`).
   * .note = the fixture is a `.yield.json` on purpose. a `.yield.md` would satisfy both
   *         patterns and re-create the very mask this case exists to remove.
   */
  given('[case2b] a stone whose yield carries a non-`.md` extension', () => {
    const routePath = path.join(ASSETS_DIR, 'route.yield');
    const stone = new RouteStone({
      name: '1.vision',
      path: path.join(routePath, '1.vision.stone'),
      guard: null,
    });

    when('[t0] only the `.yield*` glob can match it', () => {
      then('the yield file is returned', async () => {
        const artifacts = await getAllStoneArtifacts({
          stone,
          route: routePath,
        });
        expect(artifacts.some((a) => a.endsWith('1.vision.yield.json'))).toBe(
          true,
        );
      });

      /**
       * .what it clamps = the FIXTURE, never the glob. it goes green under a broken yield
       *       glob, deliberately: its job is to refuse a `.md` file added to this dir later,
       *       which would let the legacy pattern cover for the yield one and silently retire
       *       the isolation the case above depends on.
       */
      then('no `.md` file is present to cover for the yield glob', async () => {
        const artifacts = await getAllStoneArtifacts({
          stone,
          route: routePath,
        });
        expect(artifacts.some((a) => a.endsWith('.md'))).toBe(false);
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
        artifacts: ['src/**/*'],
        reviews: { self: [], peer: [] },
        judges: [],
        protect: [],
      },
    });

    when('[t0] guard artifacts glob matches files', () => {
      then('returns array with matched files from repo root', async () => {
        const artifacts = await getAllStoneArtifacts({
          stone,
          route: routePath,
        });
        expect(artifacts.length).toBeGreaterThan(0);
        expect(artifacts.some((a) => a.includes('src/index.ts'))).toBe(true);
      });
    });
  });
});
