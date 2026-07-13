import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { given, then, useBeforeAll, when } from 'test-fns';

import { RouteStone } from '@src/domain.objects/Driver/RouteStone';

import { getStonePromises } from './getStonePromises';

describe('getStonePromises', () => {
  given('[case1] no .route directory found', () => {
    const tempDir = path.join(os.tmpdir(), `test-promises-${Date.now()}-1`);

    when('[t0] getStonePromises called', () => {
      then('returns empty array', async () => {
        const stone = new RouteStone({
          name: '1.vision',
          path: '1.vision.stone',
          guard: null,
        });
        const result = await getStonePromises({
          stone,
          route: tempDir,
        });
        expect(result).toEqual([]);
      });
    });
  });

  given('[case2] .route directory found but no promise files', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = path.join(os.tmpdir(), `test-promises-${Date.now()}-2`);
      const routeDir = path.join(tempDir, '.route');
      await fs.mkdir(routeDir, { recursive: true });
      return { tempDir };
    });

    when('[t0] getStonePromises called', () => {
      then('returns empty array', async () => {
        const stone = new RouteStone({
          name: '1.vision',
          path: '1.vision.stone',
          guard: null,
        });
        const result = await getStonePromises({
          stone,
          route: scene.tempDir,
        });
        expect(result).toEqual([]);
      });
    });
  });

  given('[case3] hashless promise files found', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = path.join(os.tmpdir(), `test-promises-${Date.now()}-3`);
      const routeDir = path.join(tempDir, '.route');
      await fs.mkdir(routeDir, { recursive: true });

      // create hashless promise files
      await fs.writeFile(
        path.join(routeDir, '1.vision.guard.promise.all-done.md'),
        '# promise: all-done',
      );
      await fs.writeFile(
        path.join(routeDir, '1.vision.guard.promise.tests-pass.md'),
        '# promise: tests-pass',
      );

      return { tempDir };
    });

    when('[t0] getStonePromises called', () => {
      then('returns promise artifacts', async () => {
        const stone = new RouteStone({
          name: '1.vision',
          path: '1.vision.stone',
          guard: null,
        });
        const result = await getStonePromises({
          stone,
          route: scene.tempDir,
        });
        expect(result).toHaveLength(2);
        const slugs = result.map((p) => p.slug).sort();
        expect(slugs).toEqual(['all-done', 'tests-pass']);
      });
    });
  });

  given('[case4] promise files for different stone', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = path.join(os.tmpdir(), `test-promises-${Date.now()}-4`);
      const routeDir = path.join(tempDir, '.route');
      await fs.mkdir(routeDir, { recursive: true });

      // create promise for different stone
      await fs.writeFile(
        path.join(routeDir, '2.criteria.guard.promise.all-done.md'),
        '# promise: all-done',
      );

      return { tempDir };
    });

    when('[t0] getStonePromises called for different stone', () => {
      then('returns empty array', async () => {
        const stone = new RouteStone({
          name: '1.vision',
          path: '1.vision.stone',
          guard: null,
        });
        const result = await getStonePromises({
          stone,
          route: scene.tempDir,
        });
        expect(result).toEqual([]);
      });
    });
  });
});
