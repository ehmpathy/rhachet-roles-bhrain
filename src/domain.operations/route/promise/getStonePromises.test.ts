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
          hash: 'abc123',
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
          hash: 'abc123',
          route: scene.tempDir,
        });
        expect(result).toEqual([]);
      });
    });
  });

  given('[case3] promise files found for the hash', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = path.join(os.tmpdir(), `test-promises-${Date.now()}-3`);
      const routeDir = path.join(tempDir, '.route');
      await fs.mkdir(routeDir, { recursive: true });

      // create promise files
      await fs.writeFile(
        path.join(routeDir, '1.vision.guard.promise.all-done.abc123.md'),
        '# promise: all-done',
      );
      await fs.writeFile(
        path.join(routeDir, '1.vision.guard.promise.tests-pass.abc123.md'),
        '# promise: tests-pass',
      );

      return { tempDir };
    });

    when('[t0] getStonePromises called', () => {
      then('returns promise artifacts for that hash', async () => {
        const stone = new RouteStone({
          name: '1.vision',
          path: '1.vision.stone',
          guard: null,
        });
        const result = await getStonePromises({
          stone,
          hash: 'abc123',
          route: scene.tempDir,
        });
        expect(result).toHaveLength(2);
        const slugs = result.map((p) => p.slug).sort();
        expect(slugs).toEqual(['all-done', 'tests-pass']);
      });
    });
  });

  given('[case4] promise files found for different hash', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = path.join(os.tmpdir(), `test-promises-${Date.now()}-4`);
      const routeDir = path.join(tempDir, '.route');
      await fs.mkdir(routeDir, { recursive: true });

      // create promise files for different hash
      await fs.writeFile(
        path.join(routeDir, '1.vision.guard.promise.all-done.oldhash.md'),
        '# promise: all-done',
      );

      return { tempDir };
    });

    when('[t0] getStonePromises called with new hash', () => {
      then('returns empty array (hash invalidation)', async () => {
        const stone = new RouteStone({
          name: '1.vision',
          path: '1.vision.stone',
          guard: null,
        });
        const result = await getStonePromises({
          stone,
          hash: 'newhash',
          route: scene.tempDir,
        });
        expect(result).toEqual([]);
      });
    });
  });
});
