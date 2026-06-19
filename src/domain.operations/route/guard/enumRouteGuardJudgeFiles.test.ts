import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { given, then, useBeforeAll, when } from 'test-fns';

import { enumRouteGuardJudgeFiles } from './enumRouteGuardJudgeFiles';

describe('enumRouteGuardJudgeFiles', () => {
  given('[case1] route with no .route/ directory', () => {
    const scene = useBeforeAll(async () => {
      const route = await fs.mkdtemp(path.join(os.tmpdir(), 'route-test-'));
      return { route };
    });

    when('[t0] called with stone filter', () => {
      then('returns empty array', async () => {
        const files = await enumRouteGuardJudgeFiles({
          route: scene.route,
          stone: '1.vision',
        });
        expect(files).toEqual([]);
      });
    });
  });

  given('[case2] route with empty .route/ directory', () => {
    const scene = useBeforeAll(async () => {
      const route = await fs.mkdtemp(path.join(os.tmpdir(), 'route-test-'));
      await fs.mkdir(path.join(route, '.route'), { recursive: true });
      return { route };
    });

    when('[t0] called with stone filter', () => {
      then('returns empty array', async () => {
        const files = await enumRouteGuardJudgeFiles({
          route: scene.route,
          stone: '1.vision',
        });
        expect(files).toEqual([]);
      });
    });
  });

  given('[case3] route with judge files for different stones', () => {
    const scene = useBeforeAll(async () => {
      const route = await fs.mkdtemp(path.join(os.tmpdir(), 'route-test-'));
      const routeDir = path.join(route, '.route');
      await fs.mkdir(routeDir, { recursive: true });

      // create judges for different stones
      const files = [
        '1.vision.guard.judge.i1.abc123.j1.md',
        '1.vision.guard.judge.i2.def456.j1.md',
        '2.plan.guard.judge.i1.ghi789.j1.md',
        '3.exec.guard.judge.i1.jkl012.j1.md',
      ];
      for (const file of files) {
        await fs.writeFile(path.join(routeDir, file), '');
      }

      return { route, routeDir };
    });

    when('[t0] called with stone=1.vision', () => {
      then('returns only 1.vision files', async () => {
        const files = await enumRouteGuardJudgeFiles({
          route: scene.route,
          stone: '1.vision',
        });
        expect(files).toHaveLength(2);
        expect(files.every((f) => f.includes('1.vision'))).toBe(true);
      });
    });

    when('[t1] called with stone=2.plan', () => {
      then('returns only 2.plan files', async () => {
        const files = await enumRouteGuardJudgeFiles({
          route: scene.route,
          stone: '2.plan',
        });
        expect(files).toHaveLength(1);
        expect(files[0]).toContain('2.plan');
      });
    });

    when('[t2] called with stone=nonexistent', () => {
      then('returns empty array', async () => {
        const files = await enumRouteGuardJudgeFiles({
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
      const routeDir = path.join(route, '.route');
      await fs.mkdir(routeDir, { recursive: true });

      // create varied judge files
      const files = [
        // iteration 1, hash abc, judges 1 and 2
        '1.vision.guard.judge.i1.abc123.j1.md',
        '1.vision.guard.judge.i1.abc123.j2.md',
        // iteration 2, hash abc, judge 1
        '1.vision.guard.judge.i2.abc123.j1.md',
        // iteration 2, hash def, judge 1
        '1.vision.guard.judge.i2.def456.j1.md',
        // iteration 3, hash ghi, judges 1 and 2
        '1.vision.guard.judge.i3.ghi789.j1.md',
        '1.vision.guard.judge.i3.ghi789.j2.md',
      ];
      for (const file of files) {
        await fs.writeFile(path.join(routeDir, file), '');
      }

      return { route, routeDir };
    });

    when('[t0] called with only stone', () => {
      then('returns all files for that stone', async () => {
        const files = await enumRouteGuardJudgeFiles({
          route: scene.route,
          stone: '1.vision',
        });
        expect(files).toHaveLength(6);
      });
    });

    when('[t1] called with stone and iteration=1', () => {
      then('returns only iteration 1 files', async () => {
        const files = await enumRouteGuardJudgeFiles({
          route: scene.route,
          stone: '1.vision',
          iteration: 1,
        });
        expect(files).toHaveLength(2);
        expect(files.every((f) => f.includes('.i1.'))).toBe(true);
      });
    });

    when('[t2] called with stone and hash=abc123', () => {
      then('returns only files with that hash', async () => {
        const files = await enumRouteGuardJudgeFiles({
          route: scene.route,
          stone: '1.vision',
          hash: 'abc123',
        });
        expect(files).toHaveLength(3);
        expect(files.every((f) => f.includes('.abc123.'))).toBe(true);
      });
    });

    when('[t3] called with stone and index=2', () => {
      then('returns only judge 2 files', async () => {
        const files = await enumRouteGuardJudgeFiles({
          route: scene.route,
          stone: '1.vision',
          index: 2,
        });
        expect(files).toHaveLength(2);
        expect(files.every((f) => f.includes('.j2.'))).toBe(true);
      });
    });

    when('[t4] called with stone, iteration, and hash', () => {
      then('returns files that satisfy both criteria', async () => {
        const files = await enumRouteGuardJudgeFiles({
          route: scene.route,
          stone: '1.vision',
          iteration: 2,
          hash: 'abc123',
        });
        expect(files).toHaveLength(1);
        expect(files[0]).toContain('.i2.');
        expect(files[0]).toContain('.abc123.');
      });
    });

    when('[t5] called with stone, hash, and index', () => {
      then('returns files that satisfy all criteria', async () => {
        const files = await enumRouteGuardJudgeFiles({
          route: scene.route,
          stone: '1.vision',
          hash: 'ghi789',
          index: 2,
        });
        expect(files).toHaveLength(1);
        expect(files[0]).toContain('.ghi789.');
        expect(files[0]).toContain('.j2.');
      });
    });

    when('[t6] called with all filters', () => {
      then('returns files that satisfy all criteria', async () => {
        const files = await enumRouteGuardJudgeFiles({
          route: scene.route,
          stone: '1.vision',
          iteration: 1,
          hash: 'abc123',
          index: 1,
        });
        expect(files).toHaveLength(1);
        expect(files[0]).toContain('.i1.');
        expect(files[0]).toContain('.abc123.');
        expect(files[0]).toContain('.j1.');
      });
    });

    when('[t7] called with filters that have no results', () => {
      then('returns empty array', async () => {
        const files = await enumRouteGuardJudgeFiles({
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
        const files = await enumRouteGuardJudgeFiles({
          route: '/nonexistent/path/to/route',
          stone: '1.vision',
        });
        expect(files).toEqual([]);
      });
    });
  });

  given('[case6] .route/ directory has non-judge files', () => {
    const scene = useBeforeAll(async () => {
      const route = await fs.mkdtemp(path.join(os.tmpdir(), 'route-test-'));
      const routeDir = path.join(route, '.route');
      await fs.mkdir(routeDir, { recursive: true });

      // create mixed files - judges and non-judges
      const files = [
        '1.vision.guard.judge.i1.abc123.j1.md', // judge
        '1.vision.stone', // stone file
        '1.vision.guard', // guard file
        '1.vision.guard.promise.abc123.md', // promise file
        '1.vision.guard.selfreview.xyz.triggered.abc.md', // trigger file
      ];
      for (const file of files) {
        await fs.writeFile(path.join(routeDir, file), '');
      }

      return { route, routeDir };
    });

    when('[t0] called with stone filter', () => {
      then('returns only judge files', async () => {
        const files = await enumRouteGuardJudgeFiles({
          route: scene.route,
          stone: '1.vision',
        });
        expect(files).toHaveLength(1);
        expect(files[0]).toContain('.guard.judge.');
      });
    });
  });
});
