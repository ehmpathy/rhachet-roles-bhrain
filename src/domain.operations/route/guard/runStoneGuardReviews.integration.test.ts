import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { given, then, when } from 'test-fns';

import { RouteStone } from '@src/domain.objects/Driver/RouteStone';
import { RouteStoneGuard } from '@src/domain.objects/Driver/RouteStoneGuard';

import { runStoneGuardReviews } from './runStoneGuardReviews';

const noopContext = { cliEmit: { onGuardProgress: () => {} } };

describe('runStoneGuardReviews', () => {
  given('[case1] guard with echo review command', () => {
    const tempDir = path.join(os.tmpdir(), `test-reviews-${Date.now()}`);
    const stone = new RouteStone({
      name: '1.test',
      path: path.join(tempDir, '1.test.stone'),
      guard: null,
    });
    const guard = new RouteStoneGuard({
      path: path.join(tempDir, '1.test.guard'),
      artifacts: ['1.test*.md'],
      reviews: ['echo "blockers: 0\\nnitpicks: 1\\nreview output"'],
      judges: [],
      protect: [],
    });

    beforeEach(async () => {
      await fs.mkdir(tempDir, { recursive: true });
    });

    afterEach(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    when('[t0] reviews are executed', () => {
      then('creates review artifact file', async () => {
        const reviews = await runStoneGuardReviews(
          {
            stone,
            guard,
            hash: 'testhash',
            iteration: 1,
            route: tempDir,
          },
          noopContext,
        );
        expect(reviews).toHaveLength(1);
        expect(reviews[0]?.path).toContain('.guard.review.i1.testhash.r1.md');
        const stat = await fs.stat(reviews[0]?.path ?? '');
        expect(stat.isFile()).toBe(true);
      });

      then('parses blockers from output', async () => {
        const reviews = await runStoneGuardReviews(
          {
            stone,
            guard,
            hash: 'testhash',
            iteration: 1,
            route: tempDir,
          },
          noopContext,
        );
        expect(reviews[0]?.blockers).toEqual(0);
      });

      then('parses nitpicks from output', async () => {
        const reviews = await runStoneGuardReviews(
          {
            stone,
            guard,
            hash: 'testhash',
            iteration: 1,
            route: tempDir,
          },
          noopContext,
        );
        expect(reviews[0]?.nitpicks).toEqual(1);
      });

      then('artifact snapshot matches', async () => {
        const reviews = await runStoneGuardReviews(
          { stone, guard, hash: 'case1snap', iteration: 1, route: tempDir },
          noopContext,
        );
        const content = await fs.readFile(reviews[0]?.path ?? '', 'utf-8');
        expect(content).toMatchSnapshot();
      });

      then('return value snapshot matches', async () => {
        const reviews = await runStoneGuardReviews(
          { stone, guard, hash: 'case1ret', iteration: 1, route: tempDir },
          noopContext,
        );
        // sanitize dynamic paths for portable snapshots
        const sanitized = reviews.map((r) => ({
          ...r,
          path: r.path?.replace(tempDir, '<route>'),
        }));
        expect(sanitized).toMatchSnapshot();
      });
    });
  });

  given('[case2] guard with multiple review commands', () => {
    const tempDir = path.join(os.tmpdir(), `test-reviews-multi-${Date.now()}`);
    const stone = new RouteStone({
      name: '1.test',
      path: path.join(tempDir, '1.test.stone'),
      guard: null,
    });
    const guard = new RouteStoneGuard({
      path: path.join(tempDir, '1.test.guard'),
      artifacts: ['1.test*.md'],
      reviews: [
        'echo "blockers: 1\\nnitpicks: 0"',
        'echo "blockers: 0\\nnitpicks: 2"',
      ],
      judges: [],
      protect: [],
    });

    beforeEach(async () => {
      await fs.mkdir(tempDir, { recursive: true });
    });

    afterEach(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    when('[t0] reviews are executed', () => {
      then('creates artifact for each review', async () => {
        const reviews = await runStoneGuardReviews(
          {
            stone,
            guard,
            hash: 'multihash',
            iteration: 1,
            route: tempDir,
          },
          noopContext,
        );
        expect(reviews).toHaveLength(2);
        expect(reviews[0]?.index).toEqual(1);
        expect(reviews[1]?.index).toEqual(2);
      });

      then('artifact snapshots match', async () => {
        const reviews = await runStoneGuardReviews(
          { stone, guard, hash: 'case2snap', iteration: 1, route: tempDir },
          noopContext,
        );
        const content1 = await fs.readFile(reviews[0]?.path ?? '', 'utf-8');
        const content2 = await fs.readFile(reviews[1]?.path ?? '', 'utf-8');
        expect(content1).toMatchSnapshot();
        expect(content2).toMatchSnapshot();
      });

      then('return value snapshot matches', async () => {
        const reviews = await runStoneGuardReviews(
          { stone, guard, hash: 'case2ret', iteration: 1, route: tempDir },
          noopContext,
        );
        const sanitized = reviews.map((r) => ({
          ...r,
          path: r.path?.replace(tempDir, '<route>'),
        }));
        expect(sanitized).toMatchSnapshot();
      });
    });
  });

  given('[case3] review exits with code 0 (passed)', () => {
    const tempDir = path.join(os.tmpdir(), `test-reviews-exit0-${Date.now()}`);
    const stone = new RouteStone({
      name: '1.test',
      path: path.join(tempDir, '1.test.stone'),
      guard: null,
    });
    const guard = new RouteStoneGuard({
      path: path.join(tempDir, '1.test.guard'),
      artifacts: ['1.test*.md'],
      reviews: ['echo "blockers: 0\\nreview passed"'],
      judges: [],
      protect: [],
    });

    beforeEach(async () => {
      await fs.mkdir(tempDir, { recursive: true });
    });

    afterEach(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    when('[t0] review exits 0', () => {
      then('exitCode is 0 and exitClass is passed', async () => {
        const reviews = await runStoneGuardReviews(
          { stone, guard, hash: 'exit0hash', iteration: 1, route: tempDir },
          noopContext,
        );
        expect(reviews[0]?.exitCode).toEqual(0);
        expect(reviews[0]?.exitClass).toEqual('passed');
      });

      then('artifact contains stdout in tree bucket', async () => {
        const reviews = await runStoneGuardReviews(
          { stone, guard, hash: 'exit0hash2', iteration: 1, route: tempDir },
          noopContext,
        );
        const content = await fs.readFile(reviews[0]?.path ?? '', 'utf-8');
        expect(content).toContain('├─ stdout');
        expect(content).toContain('review passed');
      });

      then('artifact snapshot matches', async () => {
        const reviews = await runStoneGuardReviews(
          { stone, guard, hash: 'exit0snap', iteration: 1, route: tempDir },
          noopContext,
        );
        const content = await fs.readFile(reviews[0]?.path ?? '', 'utf-8');
        expect(content).toMatchSnapshot();
      });

      then('return value snapshot matches', async () => {
        const reviews = await runStoneGuardReviews(
          { stone, guard, hash: 'case3ret', iteration: 1, route: tempDir },
          noopContext,
        );
        const sanitized = reviews.map((r) => ({
          ...r,
          path: r.path?.replace(tempDir, '<route>'),
        }));
        expect(sanitized).toMatchSnapshot();
      });
    });
  });

  given('[case4] review exits with code 2 (constraint)', () => {
    const tempDir = path.join(os.tmpdir(), `test-reviews-exit2-${Date.now()}`);
    const stone = new RouteStone({
      name: '1.test',
      path: path.join(tempDir, '1.test.stone'),
      guard: null,
    });
    const guard = new RouteStoneGuard({
      path: path.join(tempDir, '1.test.guard'),
      artifacts: ['1.test*.md'],
      reviews: ['bash -c "echo blockers: 1; echo constraint failure; exit 2"'],
      judges: [],
      protect: [],
    });

    beforeEach(async () => {
      await fs.mkdir(tempDir, { recursive: true });
    });

    afterEach(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    when('[t0] review exits 2', () => {
      then('exitCode is 2 and exitClass is constraint', async () => {
        const reviews = await runStoneGuardReviews(
          { stone, guard, hash: 'exit2hash', iteration: 1, route: tempDir },
          noopContext,
        );
        expect(reviews[0]?.exitCode).toEqual(2);
        expect(reviews[0]?.exitClass).toEqual('constraint');
      });

      then('artifact contains blocked by constraints', async () => {
        const reviews = await runStoneGuardReviews(
          { stone, guard, hash: 'exit2hash2', iteration: 1, route: tempDir },
          noopContext,
        );
        const content = await fs.readFile(reviews[0]?.path ?? '', 'utf-8');
        expect(content).toContain('blocked by constraints');
        expect(content).toContain('exit code: 2');
      });

      then('artifact snapshot matches', async () => {
        const reviews = await runStoneGuardReviews(
          { stone, guard, hash: 'exit2snap', iteration: 1, route: tempDir },
          noopContext,
        );
        const content = await fs.readFile(reviews[0]?.path ?? '', 'utf-8');
        expect(content).toMatchSnapshot();
      });

      then('return value snapshot matches', async () => {
        const reviews = await runStoneGuardReviews(
          { stone, guard, hash: 'case4ret', iteration: 1, route: tempDir },
          noopContext,
        );
        const sanitized = reviews.map((r) => ({
          ...r,
          path: r.path?.replace(tempDir, '<route>'),
        }));
        expect(sanitized).toMatchSnapshot();
      });
    });
  });

  given('[case5] review exits with code 1 (malfunction)', () => {
    const tempDir = path.join(os.tmpdir(), `test-reviews-exit1-${Date.now()}`);
    const stone = new RouteStone({
      name: '1.test',
      path: path.join(tempDir, '1.test.stone'),
      guard: null,
    });
    const guard = new RouteStoneGuard({
      path: path.join(tempDir, '1.test.guard'),
      artifacts: ['1.test*.md'],
      reviews: ['bash -c "echo stdout output; echo stderr error >&2; exit 1"'],
      judges: [],
      protect: [],
    });

    beforeEach(async () => {
      await fs.mkdir(tempDir, { recursive: true });
    });

    afterEach(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    when('[t0] review exits 1', () => {
      then('exitCode is 1 and exitClass is malfunction', async () => {
        const reviews = await runStoneGuardReviews(
          { stone, guard, hash: 'exit1hash', iteration: 1, route: tempDir },
          noopContext,
        );
        expect(reviews[0]?.exitCode).toEqual(1);
        expect(reviews[0]?.exitClass).toEqual('malfunction');
      });

      then('artifact contains blocked by malfunction', async () => {
        const reviews = await runStoneGuardReviews(
          { stone, guard, hash: 'exit1hash2', iteration: 1, route: tempDir },
          noopContext,
        );
        const content = await fs.readFile(reviews[0]?.path ?? '', 'utf-8');
        expect(content).toContain('blocked by malfunction');
        expect(content).toContain('exit code: 1');
      });

      then('artifact captures both stdout and stderr', async () => {
        const reviews = await runStoneGuardReviews(
          { stone, guard, hash: 'exit1hash3', iteration: 1, route: tempDir },
          noopContext,
        );
        expect(reviews[0]?.stdout).toContain('stdout output');
        expect(reviews[0]?.stderr).toContain('stderr error');
      });

      then('artifact snapshot matches', async () => {
        const reviews = await runStoneGuardReviews(
          { stone, guard, hash: 'exit1snap', iteration: 1, route: tempDir },
          noopContext,
        );
        const content = await fs.readFile(reviews[0]?.path ?? '', 'utf-8');
        expect(content).toMatchSnapshot();
      });

      then('return value snapshot matches', async () => {
        const reviews = await runStoneGuardReviews(
          { stone, guard, hash: 'case5ret', iteration: 1, route: tempDir },
          noopContext,
        );
        const sanitized = reviews.map((r) => ({
          ...r,
          path: r.path?.replace(tempDir, '<route>'),
        }));
        expect(sanitized).toMatchSnapshot();
      });
    });
  });

  given('[case6] guard with $route variable in review command', () => {
    const tempDir = path.join(os.tmpdir(), `test-reviews-route-${Date.now()}`);
    const stone = new RouteStone({
      name: '1.test',
      path: path.join(tempDir, '1.test.stone'),
      guard: null,
    });
    // command uses $route to find a marker file at the route path
    const guard = new RouteStoneGuard({
      path: path.join(tempDir, '1.test.guard'),
      artifacts: ['1.test*.md'],
      reviews: [
        `bash -c 'if [ -f "$route/.marker" ]; then echo "blockers: 0"; echo "nitpicks: 0"; echo "marker found at $route"; else echo "blockers: 1"; echo "nitpicks: 0"; echo "marker not found at $route"; fi'`,
      ],
      judges: [],
      protect: [],
    });

    beforeEach(async () => {
      await fs.mkdir(tempDir, { recursive: true });
      // create marker file at route path
      await fs.writeFile(path.join(tempDir, '.marker'), 'test marker');
    });

    afterEach(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    when('[t0] reviews are executed with $route substitution', () => {
      then('$route is substituted with route path', async () => {
        const reviews = await runStoneGuardReviews(
          {
            stone,
            guard,
            hash: 'routehash',
            iteration: 1,
            route: tempDir,
          },
          noopContext,
        );
        expect(reviews).toHaveLength(1);
        const content = await fs.readFile(reviews[0]?.path ?? '', 'utf-8');
        // should contain the route path in output
        expect(content).toContain(tempDir);
      });

      then('review command receives correct path', async () => {
        const reviews = await runStoneGuardReviews(
          {
            stone,
            guard,
            hash: 'routehash2',
            iteration: 1,
            route: tempDir,
          },
          noopContext,
        );
        // if $route was doubled, the marker wouldn't be found
        // and blockers would be 1 instead of 0
        expect(reviews[0]?.blockers).toEqual(0);
        const content = await fs.readFile(reviews[0]?.path ?? '', 'utf-8');
        expect(content).toContain('marker found');
      });

      then('artifact snapshot matches', async () => {
        const reviews = await runStoneGuardReviews(
          { stone, guard, hash: 'case6snap', iteration: 1, route: tempDir },
          noopContext,
        );
        const content = await fs.readFile(reviews[0]?.path ?? '', 'utf-8');
        // sanitize dynamic temp path for portable snapshots
        const sanitized = content.replace(
          new RegExp(tempDir.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'),
          '<route-path>',
        );
        expect(sanitized).toMatchSnapshot();
      });

      then('return value snapshot matches', async () => {
        const reviews = await runStoneGuardReviews(
          { stone, guard, hash: 'case6ret', iteration: 1, route: tempDir },
          noopContext,
        );
        const sanitized = reviews.map((r) => ({
          ...r,
          path: r.path?.replace(tempDir, '<route>'),
          stdout: r.stdout?.replace(
            new RegExp(tempDir.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'),
            '<route-path>',
          ),
        }));
        expect(sanitized).toMatchSnapshot();
      });
    });
  });

  given('[case7] guard with $rhx variable in review command', () => {
    const tempDir = path.join(os.tmpdir(), `test-reviews-rhx-${Date.now()}`);
    const stone = new RouteStone({
      name: '1.test',
      path: path.join(tempDir, '1.test.stone'),
      guard: null,
    });
    // command echoes $rhx to show what it expands to
    const guard = new RouteStoneGuard({
      path: path.join(tempDir, '1.test.guard'),
      artifacts: ['1.test*.md'],
      reviews: [
        `bash -c 'echo "blockers: 0"; echo "nitpicks: 0"; echo "rhx=$rhx"'`,
      ],
      judges: [],
      protect: [],
    });

    beforeEach(async () => {
      await fs.mkdir(tempDir, { recursive: true });
    });

    afterEach(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    when('[t0] review uses $rhx variable', () => {
      then('$rhx is substituted with node_modules/.bin/rhx path', async () => {
        const reviews = await runStoneGuardReviews(
          {
            stone,
            guard,
            hash: 'rhxhash',
            iteration: 1,
            route: tempDir,
          },
          noopContext,
        );
        expect(reviews).toHaveLength(1);
        // should contain the expanded path in output
        const content = await fs.readFile(reviews[0]?.path ?? '', 'utf-8');
        expect(content).toContain('node_modules/.bin/rhx');
      });

      then('artifact snapshot matches', async () => {
        const reviews = await runStoneGuardReviews(
          { stone, guard, hash: 'rhxsnap', iteration: 1, route: tempDir },
          noopContext,
        );
        const content = await fs.readFile(reviews[0]?.path ?? '', 'utf-8');
        // sanitize absolute path for portable snapshots
        const sanitized = content.replace(
          /rhx=.*\/node_modules/g,
          'rhx=<repo-root>/node_modules',
        );
        expect(sanitized).toMatchSnapshot();
      });

      then('return value snapshot matches', async () => {
        const reviews = await runStoneGuardReviews(
          { stone, guard, hash: 'case7ret', iteration: 1, route: tempDir },
          noopContext,
        );
        const sanitized = reviews.map((r) => ({
          ...r,
          path: r.path?.replace(tempDir, '<route>'),
          stdout: r.stdout?.replace(
            /rhx=.*\/node_modules/g,
            'rhx=<repo-root>/node_modules',
          ),
        }));
        expect(sanitized).toMatchSnapshot();
      });
    });
  });

  given('[case8] guard with $rhachet variable in review command', () => {
    const tempDir = path.join(
      os.tmpdir(),
      `test-reviews-rhachet-${Date.now()}`,
    );
    const stone = new RouteStone({
      name: '1.test',
      path: path.join(tempDir, '1.test.stone'),
      guard: null,
    });
    // command echoes $rhachet to show what it expands to
    const guard = new RouteStoneGuard({
      path: path.join(tempDir, '1.test.guard'),
      artifacts: ['1.test*.md'],
      reviews: [
        `bash -c 'echo "blockers: 0"; echo "nitpicks: 0"; echo "rhachet=$rhachet"'`,
      ],
      judges: [],
      protect: [],
    });

    beforeEach(async () => {
      await fs.mkdir(tempDir, { recursive: true });
    });

    afterEach(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    when('[t0] review uses $rhachet variable', () => {
      then(
        '$rhachet is substituted with node_modules/.bin/rhachet path',
        async () => {
          const reviews = await runStoneGuardReviews(
            {
              stone,
              guard,
              hash: 'rhachethash',
              iteration: 1,
              route: tempDir,
            },
            noopContext,
          );
          expect(reviews).toHaveLength(1);
          // should contain the expanded path in output
          const content = await fs.readFile(reviews[0]?.path ?? '', 'utf-8');
          expect(content).toContain('node_modules/.bin/rhachet');
        },
      );

      then('artifact snapshot matches', async () => {
        const reviews = await runStoneGuardReviews(
          { stone, guard, hash: 'rhachetsnap', iteration: 1, route: tempDir },
          noopContext,
        );
        const content = await fs.readFile(reviews[0]?.path ?? '', 'utf-8');
        // sanitize absolute path for portable snapshots
        const sanitized = content.replace(
          /rhachet=.*\/node_modules/g,
          'rhachet=<repo-root>/node_modules',
        );
        expect(sanitized).toMatchSnapshot();
      });

      then('return value snapshot matches', async () => {
        const reviews = await runStoneGuardReviews(
          { stone, guard, hash: 'case8ret', iteration: 1, route: tempDir },
          noopContext,
        );
        const sanitized = reviews.map((r) => ({
          ...r,
          path: r.path?.replace(tempDir, '<route>'),
          stdout: r.stdout?.replace(
            /rhachet=.*\/node_modules/g,
            'rhachet=<repo-root>/node_modules',
          ),
        }));
        expect(sanitized).toMatchSnapshot();
      });
    });
  });

  given('[case9] guard with npx rhachet in review command', () => {
    const tempDir = path.join(os.tmpdir(), `test-reviews-npx-${Date.now()}`);
    const stone = new RouteStone({
      name: '1.test',
      path: path.join(tempDir, '1.test.stone'),
      guard: null,
    });
    const guard = new RouteStoneGuard({
      path: path.join(tempDir, '1.test.guard'),
      artifacts: ['1.test*.md'],
      reviews: ['npx rhachet run --skill review'],
      judges: [],
      protect: [],
    });

    beforeEach(async () => {
      await fs.mkdir(tempDir, { recursive: true });
    });

    afterEach(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    when('[t0] review uses npx rhachet', () => {
      then('throws error with fix suggestion', async () => {
        await expect(
          runStoneGuardReviews(
            { stone, guard, hash: 'npxhash', iteration: 1, route: tempDir },
            noopContext,
          ),
        ).rejects.toThrow('guard uses npx rhachet which causes latency');
      });

      then('error message suggests $rhachet alias', async () => {
        await expect(
          runStoneGuardReviews(
            { stone, guard, hash: 'npxhash2', iteration: 1, route: tempDir },
            noopContext,
          ),
        ).rejects.toThrow('use $rhachet alias instead');
      });
    });
  });

  given('[case10] guard with npx rhx in review command', () => {
    const tempDir = path.join(os.tmpdir(), `test-reviews-npxrhx-${Date.now()}`);
    const stone = new RouteStone({
      name: '1.test',
      path: path.join(tempDir, '1.test.stone'),
      guard: null,
    });
    const guard = new RouteStoneGuard({
      path: path.join(tempDir, '1.test.guard'),
      artifacts: ['1.test*.md'],
      reviews: ['npx rhx review --rules "*.md"'],
      judges: [],
      protect: [],
    });

    beforeEach(async () => {
      await fs.mkdir(tempDir, { recursive: true });
    });

    afterEach(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    when('[t0] review uses npx rhx', () => {
      then('throws error with fix suggestion', async () => {
        await expect(
          runStoneGuardReviews(
            { stone, guard, hash: 'npxrhxhash', iteration: 1, route: tempDir },
            noopContext,
          ),
        ).rejects.toThrow('guard uses npx rhx which causes latency');
      });

      then('error message suggests $rhx alias', async () => {
        await expect(
          runStoneGuardReviews(
            { stone, guard, hash: 'npxrhxhash2', iteration: 1, route: tempDir },
            noopContext,
          ),
        ).rejects.toThrow('use $rhx alias instead');
      });
    });
  });
});
