import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { given, then, when } from 'test-fns';

import { RouteStone } from '@src/domain.objects/Driver/RouteStone';

import { setStoneAsPromised } from './setStoneAsPromised';

describe('setStoneAsPromised', () => {
  given('[case1] .route directory does not yet found', () => {
    when('[t0] setStoneAsPromised called', () => {
      const tempDir = path.join(
        os.tmpdir(),
        `test-set-promise-${Date.now()}-1`,
      );

      then('creates .route directory and promise file', async () => {
        const stone = new RouteStone({
          name: '1.vision',
          path: '1.vision.stone',
          guard: null,
        });
        const result = await setStoneAsPromised({
          stone,
          slug: 'all-done',
          route: tempDir,
        });

        // verify .route dir created
        const routeDir = path.join(tempDir, '.route');
        const routeExists = await fs
          .access(routeDir)
          .then(() => true)
          .catch(() => false);
        expect(routeExists).toBe(true);

        // verify promise file created
        const promiseExists = await fs
          .access(result.promise.path)
          .then(() => true)
          .catch(() => false);
        expect(promiseExists).toBe(true);

        // cleanup
        await fs.rm(tempDir, { recursive: true, force: true });
      });

      then('returns promise artifact with correct properties', async () => {
        const stone = new RouteStone({
          name: '1.vision',
          path: '1.vision.stone',
          guard: null,
        });
        const result = await setStoneAsPromised({
          stone,
          slug: 'all-done',
          route: tempDir,
        });

        expect(result.promise.slug).toEqual('all-done');
        expect(result.promise.hash).toEqual('hashless');
        expect(result.promise.stone.path).toEqual('1.vision.stone');
        expect(result.promise.path).toContain(
          '1.vision.guard.promise.all-done.md',
        );

        // cleanup
        await fs.rm(tempDir, { recursive: true, force: true });
      });
    });
  });

  given('[case2] promise file content', () => {
    when('[t0] setStoneAsPromised called', () => {
      const tempDir = path.join(
        os.tmpdir(),
        `test-set-promise-${Date.now()}-2`,
      );

      then('writes promise content with metadata', async () => {
        const stone = new RouteStone({
          name: '1.vision',
          path: '1.vision.stone',
          guard: null,
        });
        const result = await setStoneAsPromised({
          stone,
          slug: 'all-done',
          route: tempDir,
        });

        const content = await fs.readFile(result.promise.path, 'utf-8');
        expect(content).toContain('# promise: all-done');
        expect(content).toContain('stone: 1.vision');
        expect(content).toContain('i promise i have completed');

        // cleanup
        await fs.rm(tempDir, { recursive: true, force: true });
      });
    });
  });

  given('[case3] hashless filename format', () => {
    when('[t0] setStoneAsPromised called', () => {
      const tempDir = path.join(
        os.tmpdir(),
        `test-set-promise-${Date.now()}-3`,
      );

      then('creates promise file without hash in filename', async () => {
        const stone = new RouteStone({
          name: '1.vision',
          path: '1.vision.stone',
          guard: null,
        });
        const result = await setStoneAsPromised({
          stone,
          slug: 'all-done',
          route: tempDir,
        });

        // verify filename has no hash (just slug.md)
        expect(result.promise.path).toContain(
          '1.vision.guard.promise.all-done.md',
        );
        expect(path.basename(result.promise.path)).toEqual(
          '1.vision.guard.promise.all-done.md',
        );

        // verify file is created
        const promiseFileFound = await fs
          .access(result.promise.path)
          .then(() => true)
          .catch(() => false);
        expect(promiseFileFound).toBe(true);

        // cleanup
        await fs.rm(tempDir, { recursive: true, force: true });
      });
    });
  });
});
