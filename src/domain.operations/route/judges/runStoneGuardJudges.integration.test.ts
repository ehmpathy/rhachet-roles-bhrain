import * as fs from 'fs/promises';
import * as path from 'path';
import { genTempDir, given, then, when } from 'test-fns';

import { RouteStone } from '@src/domain.objects/Driver/RouteStone';
import { RouteStoneGuard } from '@src/domain.objects/Driver/RouteStoneGuard';

import { runStoneGuardJudges } from './runStoneGuardJudges';

const noopContext = { cliEmit: { onGuardProgress: () => {} } };

describe('runStoneGuardJudges', () => {
  given('[case1] guard with echo judge command that passes', () => {
    const tempDir = genTempDir({ slug: 'judges-pass' });
    const stone = new RouteStone({
      name: '1.test',
      path: path.join(tempDir, '1.test.stone'),
      guard: null,
    });
    const guard = new RouteStoneGuard({
      path: path.join(tempDir, '1.test.guard'),
      artifacts: ['1.test*.md'],
      reviews: [],
      judges: ['echo "passed: true\\nreason: all checks passed"'],
    });

    when('[t0] judges are executed', () => {
      then('creates judge artifact file', async () => {
        const judges = await runStoneGuardJudges(
          {
            stone,
            guard,
            hash: 'testhash',
            iteration: 1,
            route: tempDir,
          },
          noopContext,
        );
        expect(judges).toHaveLength(1);

        // filename format: $stone.guard.judge.i$rp$j.$reviewHash.$judgeHash.j$index.md
        expect(judges[0]?.path).toContain('.guard.judge.i1p1.testhash.');
        expect(judges[0]?.path).toContain('.j1.md');
        const stat = await fs.stat(judges[0]?.path ?? '');
        expect(stat.isFile()).toBe(true);
      });

      then('parses passed status', async () => {
        const judges = await runStoneGuardJudges(
          {
            stone,
            guard,
            hash: 'testhash',
            iteration: 1,
            route: tempDir,
          },
          noopContext,
        );
        expect(judges[0]?.passed).toEqual(true);
      });

      then('parses reason', async () => {
        const judges = await runStoneGuardJudges(
          {
            stone,
            guard,
            hash: 'testhash',
            iteration: 1,
            route: tempDir,
          },
          noopContext,
        );
        expect(judges[0]?.reason).toEqual('all checks passed');
      });
    });
  });

  given('[case2] guard with judge command that fails', () => {
    const tempDir = genTempDir({ slug: 'judges-fail' });
    const stone = new RouteStone({
      name: '1.test',
      path: path.join(tempDir, '1.test.stone'),
      guard: null,
    });
    const guard = new RouteStoneGuard({
      path: path.join(tempDir, '1.test.guard'),
      artifacts: ['1.test*.md'],
      reviews: [],
      judges: ['echo "passed: false\\nreason: blockers found"'],
    });

    when('[t0] judges are executed', () => {
      then('parses failed status', async () => {
        const judges = await runStoneGuardJudges(
          {
            stone,
            guard,
            hash: 'failhash',
            iteration: 1,
            route: tempDir,
          },
          noopContext,
        );
        expect(judges[0]?.passed).toEqual(false);
        expect(judges[0]?.reason).toEqual('blockers found');
      });
    });
  });

  given('[case3] guard with multiple judge commands', () => {
    const tempDir = genTempDir({ slug: 'judges-multi' });
    const stone = new RouteStone({
      name: '1.test',
      path: path.join(tempDir, '1.test.stone'),
      guard: null,
    });
    const guard = new RouteStoneGuard({
      path: path.join(tempDir, '1.test.guard'),
      artifacts: ['1.test*.md'],
      reviews: [],
      judges: [
        'echo "passed: true\\nreason: review passed"',
        'echo "passed: false\\nreason: approval required"',
      ],
    });

    when('[t0] judges are executed', () => {
      then('creates artifact for each judge', async () => {
        const judges = await runStoneGuardJudges(
          {
            stone,
            guard,
            hash: 'multihash',
            iteration: 1,
            route: tempDir,
          },
          noopContext,
        );
        expect(judges).toHaveLength(2);
        expect(judges[0]?.index).toEqual(1);
        expect(judges[0]?.passed).toEqual(true);
        expect(judges[1]?.index).toEqual(2);
        expect(judges[1]?.passed).toEqual(false);
      });
    });
  });

  given('[case4] guard with $route variable in judge command', () => {
    const tempDir = genTempDir({ slug: 'judges-route-var' });
    const stone = new RouteStone({
      name: '1.test',
      path: path.join(tempDir, '1.test.stone'),
      guard: null,
    });

    // command uses $route to find a marker file — proves $route is substituted correctly
    // and that the command runs from repo root (not from route dir)
    const guard = new RouteStoneGuard({
      path: path.join(tempDir, '1.test.guard'),
      artifacts: ['1.test*.md'],
      reviews: [],
      judges: [
        `bash -c 'if [ -f "$route/.marker" ]; then echo "passed: true"; echo "reason: marker found at $route"; else echo "passed: false"; echo "reason: marker not found at $route"; fi'`.replace(
          /\$route/g,
          '$route',
        ),
      ],
    });

    beforeEach(async () => {
      // create marker file that command will look for via $route
      await fs.writeFile(path.join(tempDir, '.marker'), 'present');
    });

    when('[t0] judges are executed with $route substitution', () => {
      then('$route is substituted with route path', async () => {
        const judges = await runStoneGuardJudges(
          {
            stone,
            guard,
            hash: 'routehash',
            iteration: 1,
            route: tempDir,
          },
          noopContext,
        );
        expect(judges).toHaveLength(1);
        // command should find the marker file via $route path
        expect(judges[0]?.passed).toEqual(true);
        expect(judges[0]?.reason).toContain('marker found');
      });

      then('judge command receives correct path', async () => {
        const judges = await runStoneGuardJudges(
          {
            stone,
            guard,
            hash: 'routehash',
            iteration: 1,
            route: tempDir,
          },
          noopContext,
        );
        // reason should include the actual route path
        expect(judges[0]?.reason).toContain(tempDir);
      });
    });
  });

  given('[case5] passed judge is cached on retry', () => {
    const tempDir = genTempDir({ slug: 'judges-cache-pass' });
    const stone = new RouteStone({
      name: '1.test',
      path: path.join(tempDir, '1.test.stone'),
      guard: null,
    });
    const guard = new RouteStoneGuard({
      path: path.join(tempDir, '1.test.guard'),
      artifacts: ['1.test*.md'],
      reviews: [],
      judges: ['echo "passed: true\\nreason: all checks passed"'],
    });

    when('[t0] judge passes on first attempt', () => {
      then('judge is cached and reused on second call', async () => {
        // first call: execute judge
        const judgesFirst = await runStoneGuardJudges(
          { stone, guard, hash: 'cachehash', iteration: 1, route: tempDir },
          noopContext,
        );
        expect(judgesFirst).toHaveLength(1);
        expect(judgesFirst[0]?.passed).toEqual(true);
        const firstPath = judgesFirst[0]?.path;

        // second call with same hash: should reuse cached result
        const judgesSecond = await runStoneGuardJudges(
          { stone, guard, hash: 'cachehash', iteration: 1, route: tempDir },
          noopContext,
        );
        expect(judgesSecond).toHaveLength(1);
        expect(judgesSecond[0]?.passed).toEqual(true);
        // same artifact path = cached result reused
        expect(judgesSecond[0]?.path).toEqual(firstPath);
      });
    });
  });

  given('[case6] failed judge is NOT cached (retries fresh)', () => {
    const tempDir = genTempDir({ slug: 'judges-nocache-fail' });
    const stone = new RouteStone({
      name: '1.test',
      path: path.join(tempDir, '1.test.stone'),
      guard: null,
    });
    const guard = new RouteStoneGuard({
      path: path.join(tempDir, '1.test.guard'),
      artifacts: ['1.test*.md'],
      reviews: [],
      judges: ['echo "passed: false\\nreason: blockers found"'],
    });

    when('[t0] judge fails on first attempt', () => {
      then('judge is NOT cached and re-executes on second call', async () => {
        // first call: execute judge (fails)
        const judgesFirst = await runStoneGuardJudges(
          { stone, guard, hash: 'failcachehash', iteration: 1, route: tempDir },
          noopContext,
        );
        expect(judgesFirst).toHaveLength(1);
        expect(judgesFirst[0]?.passed).toEqual(false);
        const firstPath = judgesFirst[0]?.path;

        // second call with same hash: should execute fresh (not cached)
        const judgesSecond = await runStoneGuardJudges(
          { stone, guard, hash: 'failcachehash', iteration: 1, route: tempDir },
          noopContext,
        );
        expect(judgesSecond).toHaveLength(1);
        expect(judgesSecond[0]?.passed).toEqual(false);
        // different artifact path = fresh execution (not cached)
        expect(judgesSecond[0]?.path).not.toEqual(firstPath);
      });
    });
  });

  given('[case7] blocked judge (exit 2) is NOT cached', () => {
    const tempDir = genTempDir({ slug: 'judges-nocache-block' });
    const stone = new RouteStone({
      name: '1.test',
      path: path.join(tempDir, '1.test.stone'),
      guard: null,
    });
    // command exits with code 2 to simulate "blocked by constraints"
    const guard = new RouteStoneGuard({
      path: path.join(tempDir, '1.test.guard'),
      artifacts: ['1.test*.md'],
      reviews: [],
      judges: [
        'bash -c \'echo "passed: false"; echo "reason: approval required"; exit 2\'',
      ],
    });

    when('[t0] judge blocks on first attempt', () => {
      then('judge is NOT cached and re-executes on second call', async () => {
        // first call: execute judge (blocks with exit 2)
        const judgesFirst = await runStoneGuardJudges(
          {
            stone,
            guard,
            hash: 'blockcachehash',
            iteration: 1,
            route: tempDir,
          },
          noopContext,
        );
        expect(judgesFirst).toHaveLength(1);
        expect(judgesFirst[0]?.passed).toEqual(false);
        const firstPath = judgesFirst[0]?.path;

        // second call with same hash: should execute fresh (not cached)
        const judgesSecond = await runStoneGuardJudges(
          {
            stone,
            guard,
            hash: 'blockcachehash',
            iteration: 1,
            route: tempDir,
          },
          noopContext,
        );
        expect(judgesSecond).toHaveLength(1);
        expect(judgesSecond[0]?.passed).toEqual(false);
        // different artifact path = fresh execution (not cached)
        expect(judgesSecond[0]?.path).not.toEqual(firstPath);
      });
    });
  });
});
