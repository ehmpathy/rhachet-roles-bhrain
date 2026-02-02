import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { getError, given, then, when } from 'test-fns';

import { stepRouteStoneGet } from './stepRouteStoneGet';

const ASSETS_DIR = path.join(__dirname, '.test/assets');

describe('stepRouteStoneGet', () => {
  given('[case1] route.simple fixture (no guards, no artifacts)', () => {
    const routePath = path.join(ASSETS_DIR, 'route.simple');

    when('[t0] query is @next-one', () => {
      then('returns first incomplete stone', async () => {
        const result = await stepRouteStoneGet({
          stone: '@next-one',
          route: routePath,
        });
        expect(result.stones).toHaveLength(1);
        expect(result.stones[0]?.name).toEqual('1.vision');
      });
    });

    when('[t1] query is @next-all', () => {
      then(
        'returns all stones with same prefix as first incomplete',
        async () => {
          const result = await stepRouteStoneGet({
            stone: '@next-all',
            route: routePath,
          });
          // route.simple has 1.vision, 2.criteria, 3.plan - all different prefixes
          expect(result.stones).toHaveLength(1);
          expect(result.stones[0]?.name).toEqual('1.vision');
        },
      );
    });

    when('[t2] query is glob pattern', () => {
      then('returns stones that match glob', async () => {
        const result = await stepRouteStoneGet({
          stone: '*.criteria',
          route: routePath,
        });
        expect(result.stones).toHaveLength(1);
        expect(result.stones[0]?.name).toEqual('2.criteria');
      });
    });

    when('[t3] --say flag is provided', () => {
      then('emits stone content to stdout', async () => {
        const result = await stepRouteStoneGet({
          stone: '1.vision',
          route: routePath,
          say: true,
        });
        expect(result.emit).not.toBeNull();
        expect(result.emit?.stdout).toContain('# 1.vision');
      });
    });
  });

  given('[case2] route.parallel fixture', () => {
    const routePath = path.join(ASSETS_DIR, 'route.parallel');

    when('[t0] query is @next-all after 2.criteria is complete', () => {
      const tempDir = path.join(os.tmpdir(), `test-get-parallel-${Date.now()}`);

      beforeEach(async () => {
        await fs.cp(routePath, tempDir, { recursive: true });
        // create artifact and passage for 2.criteria
        await fs.writeFile(path.join(tempDir, '2.criteria.md'), '# Criteria');
        await fs.mkdir(path.join(tempDir, '.route'), { recursive: true });
        await fs.writeFile(
          path.join(tempDir, '.route', '2.criteria.passed'),
          '',
        );
      });

      afterEach(async () => {
        await fs.rm(tempDir, { recursive: true, force: true });
      });

      then('returns all 3.1.x stones', async () => {
        const result = await stepRouteStoneGet({
          stone: '@next-all',
          route: tempDir,
        });
        expect(result.stones).toHaveLength(3);
        expect(result.stones.map((s) => s.name).sort()).toEqual([
          '3.1.research.domain',
          '3.1.research.prior',
          '3.1.research.template',
        ]);
      });
    });
  });

  given('[case3] all stones complete', () => {
    const tempDir = path.join(os.tmpdir(), `test-get-complete-${Date.now()}`);

    beforeEach(async () => {
      await fs.cp(path.join(ASSETS_DIR, 'route.simple'), tempDir, {
        recursive: true,
      });
      // create artifacts and passages for all stones
      await fs.writeFile(path.join(tempDir, '1.vision.md'), '# Vision');
      await fs.writeFile(path.join(tempDir, '2.criteria.md'), '# Criteria');
      await fs.writeFile(path.join(tempDir, '3.plan.md'), '# Plan');
      await fs.mkdir(path.join(tempDir, '.route'), { recursive: true });
      await fs.writeFile(path.join(tempDir, '.route', '1.vision.passed'), '');
      await fs.writeFile(path.join(tempDir, '.route', '2.criteria.passed'), '');
      await fs.writeFile(path.join(tempDir, '.route', '3.plan.passed'), '');
    });

    afterEach(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    when('[t0] query is @next-one', () => {
      then('returns empty array and emits "all stones passed"', async () => {
        const result = await stepRouteStoneGet({
          stone: '@next-one',
          route: tempDir,
        });
        expect(result.stones).toHaveLength(0);
        expect(result.emit?.stdout).toContain('all stones passed');
      });
    });
  });

  given('[case4] route not found', () => {
    when('[t0] route path does not exist', () => {
      then('throws route not found error', async () => {
        const error = await getError(
          stepRouteStoneGet({
            stone: '@next-one',
            route: '/nonexistent/path',
          }),
        );
        expect(error).toBeInstanceOf(Error);
        expect(error.message).toContain('route not found');
      });
    });
  });
});
