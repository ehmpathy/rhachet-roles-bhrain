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
      protect: [],
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

      then('artifact snapshot matches', async () => {
        const judges = await runStoneGuardJudges(
          { stone, guard, hash: 'case1snap', iteration: 1, route: tempDir },
          noopContext,
        );
        const content = await fs.readFile(judges[0]?.path ?? '', 'utf-8');
        expect(content).toMatchSnapshot();
      });

      then('return value snapshot matches', async () => {
        const judges = await runStoneGuardJudges(
          { stone, guard, hash: 'case1ret', iteration: 1, route: tempDir },
          noopContext,
        );
        // sanitize dynamic paths for portable snapshots
        const sanitized = judges.map((j) => ({
          ...j,
          path: j.path?.replace(tempDir, '<route>'),
        }));
        expect(sanitized).toMatchSnapshot();
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
      protect: [],
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

      then('artifact snapshot matches', async () => {
        const judges = await runStoneGuardJudges(
          { stone, guard, hash: 'case2snap', iteration: 1, route: tempDir },
          noopContext,
        );
        const content = await fs.readFile(judges[0]?.path ?? '', 'utf-8');
        expect(content).toMatchSnapshot();
      });

      then('return value snapshot matches', async () => {
        const judges = await runStoneGuardJudges(
          { stone, guard, hash: 'case2ret', iteration: 1, route: tempDir },
          noopContext,
        );
        const sanitized = judges.map((j) => ({
          ...j,
          path: j.path?.replace(tempDir, '<route>'),
        }));
        expect(sanitized).toMatchSnapshot();
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
      protect: [],
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

      then('artifact snapshots match', async () => {
        const judges = await runStoneGuardJudges(
          { stone, guard, hash: 'case3snap', iteration: 1, route: tempDir },
          noopContext,
        );
        const content1 = await fs.readFile(judges[0]?.path ?? '', 'utf-8');
        const content2 = await fs.readFile(judges[1]?.path ?? '', 'utf-8');
        expect(content1).toMatchSnapshot();
        expect(content2).toMatchSnapshot();
      });

      then('return value snapshot matches', async () => {
        const judges = await runStoneGuardJudges(
          { stone, guard, hash: 'case3ret', iteration: 1, route: tempDir },
          noopContext,
        );
        const sanitized = judges.map((j) => ({
          ...j,
          path: j.path?.replace(tempDir, '<route>'),
        }));
        expect(sanitized).toMatchSnapshot();
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
      protect: [],
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

      then('artifact snapshot matches', async () => {
        const judges = await runStoneGuardJudges(
          { stone, guard, hash: 'case4snap', iteration: 1, route: tempDir },
          noopContext,
        );
        const content = await fs.readFile(judges[0]?.path ?? '', 'utf-8');
        // sanitize dynamic temp path for portable snapshots
        const sanitized = content.replace(
          new RegExp(tempDir.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'),
          '<route-path>',
        );
        expect(sanitized).toMatchSnapshot();
      });

      then('return value snapshot matches', async () => {
        const judges = await runStoneGuardJudges(
          { stone, guard, hash: 'case4ret', iteration: 1, route: tempDir },
          noopContext,
        );
        const sanitized = judges.map((j) => ({
          ...j,
          path: j.path?.replace(tempDir, '<route>'),
          reason: j.reason?.replace(
            new RegExp(tempDir.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'),
            '<route-path>',
          ),
        }));
        expect(sanitized).toMatchSnapshot();
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
      protect: [],
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

      then('artifact snapshot matches', async () => {
        const judges = await runStoneGuardJudges(
          { stone, guard, hash: 'case5snap', iteration: 1, route: tempDir },
          noopContext,
        );
        const content = await fs.readFile(judges[0]?.path ?? '', 'utf-8');
        expect(content).toMatchSnapshot();
      });

      then('return value snapshot matches', async () => {
        const judges = await runStoneGuardJudges(
          { stone, guard, hash: 'case5ret', iteration: 1, route: tempDir },
          noopContext,
        );
        const sanitized = judges.map((j) => ({
          ...j,
          path: j.path?.replace(tempDir, '<route>'),
        }));
        expect(sanitized).toMatchSnapshot();
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
      protect: [],
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

      then('artifact snapshot matches', async () => {
        const judges = await runStoneGuardJudges(
          { stone, guard, hash: 'case6snap', iteration: 1, route: tempDir },
          noopContext,
        );
        const content = await fs.readFile(judges[0]?.path ?? '', 'utf-8');
        expect(content).toMatchSnapshot();
      });

      then('return value snapshot matches', async () => {
        const judges = await runStoneGuardJudges(
          { stone, guard, hash: 'case6ret', iteration: 1, route: tempDir },
          noopContext,
        );
        const sanitized = judges.map((j) => ({
          ...j,
          path: j.path?.replace(tempDir, '<route>'),
        }));
        expect(sanitized).toMatchSnapshot();
      });
    });
  });

  given('[case7] judge exits with code 0 (passed)', () => {
    const tempDir = genTempDir({ slug: 'judges-exit0' });
    const stone = new RouteStone({
      name: '1.test',
      path: path.join(tempDir, '1.test.stone'),
      guard: null,
    });
    const guard = new RouteStoneGuard({
      path: path.join(tempDir, '1.test.guard'),
      artifacts: ['1.test*.md'],
      reviews: [],
      judges: ['echo "passed: true\\nreason: judge passed"'],
      protect: [],
    });

    when('[t0] judge exits 0', () => {
      then('exitCode is 0 and exitClass is passed', async () => {
        const judges = await runStoneGuardJudges(
          { stone, guard, hash: 'exit0hash', iteration: 1, route: tempDir },
          noopContext,
        );
        expect(judges[0]?.exitCode).toEqual(0);
        expect(judges[0]?.exitClass).toEqual('passed');
      });

      then('artifact contains stdout in tree bucket', async () => {
        const judges = await runStoneGuardJudges(
          { stone, guard, hash: 'exit0hash2', iteration: 1, route: tempDir },
          noopContext,
        );
        const content = await fs.readFile(judges[0]?.path ?? '', 'utf-8');
        expect(content).toContain('├─ stdout');
        expect(content).toContain('judge passed');
      });

      then('artifact snapshot matches', async () => {
        const judges = await runStoneGuardJudges(
          { stone, guard, hash: 'exit0snap', iteration: 1, route: tempDir },
          noopContext,
        );
        const content = await fs.readFile(judges[0]?.path ?? '', 'utf-8');
        expect(content).toMatchSnapshot();
      });

      then('return value snapshot matches', async () => {
        const judges = await runStoneGuardJudges(
          { stone, guard, hash: 'case7ret', iteration: 1, route: tempDir },
          noopContext,
        );
        const sanitized = judges.map((j) => ({
          ...j,
          path: j.path?.replace(tempDir, '<route>'),
        }));
        expect(sanitized).toMatchSnapshot();
      });
    });
  });

  given('[case8] judge exits with code 2 (constraint)', () => {
    const tempDir = genTempDir({ slug: 'judges-exit2' });
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
        'bash -c "echo passed: false; echo reason: approval required; exit 2"',
      ],
      protect: [],
    });

    when('[t0] judge exits 2', () => {
      then('exitCode is 2 and exitClass is constraint', async () => {
        const judges = await runStoneGuardJudges(
          { stone, guard, hash: 'exit2hash', iteration: 1, route: tempDir },
          noopContext,
        );
        expect(judges[0]?.exitCode).toEqual(2);
        expect(judges[0]?.exitClass).toEqual('constraint');
      });

      then('artifact contains blocked by constraints', async () => {
        const judges = await runStoneGuardJudges(
          { stone, guard, hash: 'exit2hash2', iteration: 1, route: tempDir },
          noopContext,
        );
        const content = await fs.readFile(judges[0]?.path ?? '', 'utf-8');
        expect(content).toContain('blocked by constraints');
        expect(content).toContain('exit code: 2');
      });

      then('artifact snapshot matches', async () => {
        const judges = await runStoneGuardJudges(
          { stone, guard, hash: 'exit2snap', iteration: 1, route: tempDir },
          noopContext,
        );
        const content = await fs.readFile(judges[0]?.path ?? '', 'utf-8');
        expect(content).toMatchSnapshot();
      });

      then('return value snapshot matches', async () => {
        const judges = await runStoneGuardJudges(
          { stone, guard, hash: 'case8ret', iteration: 1, route: tempDir },
          noopContext,
        );
        const sanitized = judges.map((j) => ({
          ...j,
          path: j.path?.replace(tempDir, '<route>'),
        }));
        expect(sanitized).toMatchSnapshot();
      });
    });
  });

  given('[case9] judge exits with code 1 (malfunction)', () => {
    const tempDir = genTempDir({ slug: 'judges-exit1' });
    const stone = new RouteStone({
      name: '1.test',
      path: path.join(tempDir, '1.test.stone'),
      guard: null,
    });
    const guard = new RouteStoneGuard({
      path: path.join(tempDir, '1.test.guard'),
      artifacts: ['1.test*.md'],
      reviews: [],
      judges: ['bash -c "echo stdout output; echo stderr error >&2; exit 1"'],
      protect: [],
    });

    when('[t0] judge exits 1', () => {
      then('exitCode is 1 and exitClass is malfunction', async () => {
        const judges = await runStoneGuardJudges(
          { stone, guard, hash: 'exit1hash', iteration: 1, route: tempDir },
          noopContext,
        );
        expect(judges[0]?.exitCode).toEqual(1);
        expect(judges[0]?.exitClass).toEqual('malfunction');
      });

      then('artifact contains blocked by malfunction', async () => {
        const judges = await runStoneGuardJudges(
          { stone, guard, hash: 'exit1hash2', iteration: 1, route: tempDir },
          noopContext,
        );
        const content = await fs.readFile(judges[0]?.path ?? '', 'utf-8');
        expect(content).toContain('blocked by malfunction');
        expect(content).toContain('exit code: 1');
      });

      then('artifact captures both stdout and stderr', async () => {
        const judges = await runStoneGuardJudges(
          { stone, guard, hash: 'exit1hash3', iteration: 1, route: tempDir },
          noopContext,
        );
        expect(judges[0]?.stdout).toContain('stdout output');
        expect(judges[0]?.stderr).toContain('stderr error');
      });

      then('artifact snapshot matches', async () => {
        const judges = await runStoneGuardJudges(
          { stone, guard, hash: 'exit1snap', iteration: 1, route: tempDir },
          noopContext,
        );
        const content = await fs.readFile(judges[0]?.path ?? '', 'utf-8');
        expect(content).toMatchSnapshot();
      });

      then('return value snapshot matches', async () => {
        const judges = await runStoneGuardJudges(
          { stone, guard, hash: 'case9ret', iteration: 1, route: tempDir },
          noopContext,
        );
        const sanitized = judges.map((j) => ({
          ...j,
          path: j.path?.replace(tempDir, '<route>'),
        }));
        expect(sanitized).toMatchSnapshot();
      });
    });
  });

  given('[case10] blocked judge (exit 2) is NOT cached', () => {
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
      protect: [],
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

      then('artifact snapshot matches', async () => {
        const judges = await runStoneGuardJudges(
          { stone, guard, hash: 'case10snap', iteration: 1, route: tempDir },
          noopContext,
        );
        const content = await fs.readFile(judges[0]?.path ?? '', 'utf-8');
        expect(content).toMatchSnapshot();
      });

      then('return value snapshot matches', async () => {
        const judges = await runStoneGuardJudges(
          { stone, guard, hash: 'case10ret', iteration: 1, route: tempDir },
          noopContext,
        );
        const sanitized = judges.map((j) => ({
          ...j,
          path: j.path?.replace(tempDir, '<route>'),
        }));
        expect(sanitized).toMatchSnapshot();
      });
    });
  });

  given('[case11] guard with $rhx variable in judge command', () => {
    const tempDir = genTempDir({ slug: 'judges-rhx-var' });
    const stone = new RouteStone({
      name: '1.test',
      path: path.join(tempDir, '1.test.stone'),
      guard: null,
    });
    // command echoes $rhx to show what it expands to
    const guard = new RouteStoneGuard({
      path: path.join(tempDir, '1.test.guard'),
      artifacts: ['1.test*.md'],
      reviews: [],
      judges: [`bash -c 'echo "passed: true"; echo "reason: rhx=$rhx"'`],
      protect: [],
    });

    when('[t0] judge uses $rhx variable', () => {
      then('$rhx is substituted with node_modules/.bin/rhx path', async () => {
        const judges = await runStoneGuardJudges(
          {
            stone,
            guard,
            hash: 'rhxhash',
            iteration: 1,
            route: tempDir,
          },
          noopContext,
        );
        expect(judges).toHaveLength(1);
        // should contain the expanded path in output
        const content = await fs.readFile(judges[0]?.path ?? '', 'utf-8');
        expect(content).toContain('node_modules/.bin/rhx');
      });

      then('artifact snapshot matches', async () => {
        const judges = await runStoneGuardJudges(
          { stone, guard, hash: 'rhxsnap', iteration: 1, route: tempDir },
          noopContext,
        );
        const content = await fs.readFile(judges[0]?.path ?? '', 'utf-8');
        // sanitize absolute path for portable snapshots
        const sanitized = content.replace(
          /rhx=.*\/node_modules/g,
          'rhx=<repo-root>/node_modules',
        );
        expect(sanitized).toMatchSnapshot();
      });

      then('return value snapshot matches', async () => {
        const judges = await runStoneGuardJudges(
          { stone, guard, hash: 'case11ret', iteration: 1, route: tempDir },
          noopContext,
        );
        const sanitized = judges.map((j) => ({
          ...j,
          path: j.path?.replace(tempDir, '<route>'),
          reason: j.reason?.replace(
            /rhx=.*\/node_modules/g,
            'rhx=<repo-root>/node_modules',
          ),
        }));
        expect(sanitized).toMatchSnapshot();
      });
    });
  });

  given('[case12] guard with $rhachet variable in judge command', () => {
    const tempDir = genTempDir({ slug: 'judges-rhachet-var' });
    const stone = new RouteStone({
      name: '1.test',
      path: path.join(tempDir, '1.test.stone'),
      guard: null,
    });
    // command echoes $rhachet to show what it expands to
    const guard = new RouteStoneGuard({
      path: path.join(tempDir, '1.test.guard'),
      artifacts: ['1.test*.md'],
      reviews: [],
      judges: [
        `bash -c 'echo "passed: true"; echo "reason: rhachet=$rhachet"'`,
      ],
      protect: [],
    });

    when('[t0] judge uses $rhachet variable', () => {
      then(
        '$rhachet is substituted with node_modules/.bin/rhachet path',
        async () => {
          const judges = await runStoneGuardJudges(
            {
              stone,
              guard,
              hash: 'rhachethash',
              iteration: 1,
              route: tempDir,
            },
            noopContext,
          );
          expect(judges).toHaveLength(1);
          // should contain the expanded path in output
          const content = await fs.readFile(judges[0]?.path ?? '', 'utf-8');
          expect(content).toContain('node_modules/.bin/rhachet');
        },
      );

      then('artifact snapshot matches', async () => {
        const judges = await runStoneGuardJudges(
          { stone, guard, hash: 'rhachetsnap', iteration: 1, route: tempDir },
          noopContext,
        );
        const content = await fs.readFile(judges[0]?.path ?? '', 'utf-8');
        // sanitize absolute path for portable snapshots
        const sanitized = content.replace(
          /rhachet=.*\/node_modules/g,
          'rhachet=<repo-root>/node_modules',
        );
        expect(sanitized).toMatchSnapshot();
      });

      then('return value snapshot matches', async () => {
        const judges = await runStoneGuardJudges(
          { stone, guard, hash: 'case12ret', iteration: 1, route: tempDir },
          noopContext,
        );
        const sanitized = judges.map((j) => ({
          ...j,
          path: j.path?.replace(tempDir, '<route>'),
          reason: j.reason?.replace(
            /rhachet=.*\/node_modules/g,
            'rhachet=<repo-root>/node_modules',
          ),
        }));
        expect(sanitized).toMatchSnapshot();
      });
    });
  });

  given('[case13] guard with npx rhachet in judge command', () => {
    const tempDir = genTempDir({ slug: 'judges-npx-rhachet' });
    const stone = new RouteStone({
      name: '1.test',
      path: path.join(tempDir, '1.test.stone'),
      guard: null,
    });
    const guard = new RouteStoneGuard({
      path: path.join(tempDir, '1.test.guard'),
      artifacts: ['1.test*.md'],
      reviews: [],
      judges: ['npx rhachet run --skill route.stone.judge'],
      protect: [],
    });

    when('[t0] judge uses npx rhachet', () => {
      then('throws error with fix suggestion', async () => {
        await expect(
          runStoneGuardJudges(
            { stone, guard, hash: 'npxhash', iteration: 1, route: tempDir },
            noopContext,
          ),
        ).rejects.toThrow('guard uses npx rhachet which causes latency');
      });

      then('error message suggests $rhachet alias', async () => {
        await expect(
          runStoneGuardJudges(
            { stone, guard, hash: 'npxhash2', iteration: 1, route: tempDir },
            noopContext,
          ),
        ).rejects.toThrow('use $rhachet alias instead');
      });
    });
  });

  given('[case14] guard with npx rhx in judge command', () => {
    const tempDir = genTempDir({ slug: 'judges-npx-rhx' });
    const stone = new RouteStone({
      name: '1.test',
      path: path.join(tempDir, '1.test.stone'),
      guard: null,
    });
    const guard = new RouteStoneGuard({
      path: path.join(tempDir, '1.test.guard'),
      artifacts: ['1.test*.md'],
      reviews: [],
      judges: ['npx rhx route.stone.judge --stone 1.test'],
      protect: [],
    });

    when('[t0] judge uses npx rhx', () => {
      then('throws error with fix suggestion', async () => {
        await expect(
          runStoneGuardJudges(
            { stone, guard, hash: 'npxrhxhash', iteration: 1, route: tempDir },
            noopContext,
          ),
        ).rejects.toThrow('guard uses npx rhx which causes latency');
      });

      then('error message suggests $rhx alias', async () => {
        await expect(
          runStoneGuardJudges(
            { stone, guard, hash: 'npxrhxhash2', iteration: 1, route: tempDir },
            noopContext,
          ),
        ).rejects.toThrow('use $rhx alias instead');
      });
    });
  });
});
