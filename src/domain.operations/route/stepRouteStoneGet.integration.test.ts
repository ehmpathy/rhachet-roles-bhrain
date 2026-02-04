import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { given, then, when } from 'test-fns';

import { stepRouteStoneGet } from './stepRouteStoneGet';

const ASSETS_DIR = path.join(__dirname, '.test/assets');

describe('stepRouteStoneGet.integration', () => {
  given('[case1] route.approved fixture (complete route)', () => {
    const routePath = path.join(ASSETS_DIR, 'route.approved');

    when('[t0] query is @next-one', () => {
      then('returns empty because stone is passed', async () => {
        const result = await stepRouteStoneGet({
          stone: '@next-one',
          route: routePath,
        });
        expect(result.stones).toHaveLength(0);
        expect(result.emit?.stdout).toContain('all stones passed');
      });
    });
  });

  given('[case2] route with partial completion', () => {
    const tempDir = path.join(os.tmpdir(), `test-get-partial-${Date.now()}`);

    beforeEach(async () => {
      await fs.cp(path.join(ASSETS_DIR, 'route.parallel'), tempDir, {
        recursive: true,
      });
      // complete first stone
      await fs.writeFile(path.join(tempDir, '2.criteria.md'), '# Criteria');
      await fs.mkdir(path.join(tempDir, '.route'), { recursive: true });
      await fs.writeFile(path.join(tempDir, '.route', '2.criteria.passed'), '');
    });

    afterEach(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    when('[t0] query is @next-one', () => {
      then('returns first 3.1.x stone', async () => {
        const result = await stepRouteStoneGet({
          stone: '@next-one',
          route: tempDir,
        });
        expect(result.stones).toHaveLength(1);
        expect(result.stones[0]?.name).toMatch(/^3\.1\./);
      });
    });

    when('[t1] query is @next-all', () => {
      then('returns all 3.1.x stones for parallel execution', async () => {
        const result = await stepRouteStoneGet({
          stone: '@next-all',
          route: tempDir,
        });
        expect(result.stones).toHaveLength(3);
        expect(result.stones.every((s) => s.name.startsWith('3.1.'))).toBe(
          true,
        );
      });
    });
  });

  given('[case3] route.reviewed fixture', () => {
    const routePath = path.join(ASSETS_DIR, 'route.reviewed');

    when('[t0] --say flag emits stone content', () => {
      then('stdout contains stone content', async () => {
        const result = await stepRouteStoneGet({
          stone: '1.implement',
          route: routePath,
          say: true,
        });
        expect(result.emit).not.toBeNull();
        expect(result.emit?.stdout).toContain('# 1.implement');
      });
    });
  });

  given('[case4] route.alternate fixture (different extensions)', () => {
    const routePath = path.join(ASSETS_DIR, 'route.alternate');

    when('[t0] --say flag with .src.stone extension', () => {
      then('reads content from .src.stone file', async () => {
        const result = await stepRouteStoneGet({
          stone: '1.vision',
          route: routePath,
          say: true,
        });
        expect(result.emit).not.toBeNull();
        expect(result.emit?.stdout).toContain('# 1.vision');
      });
    });

    when('[t1] --say flag with .src extension', () => {
      then('reads content from .src file', async () => {
        const result = await stepRouteStoneGet({
          stone: '2.criteria',
          route: routePath,
          say: true,
        });
        expect(result.emit).not.toBeNull();
        expect(result.emit?.stdout).toContain('# 2.criteria');
      });
    });
  });
});
