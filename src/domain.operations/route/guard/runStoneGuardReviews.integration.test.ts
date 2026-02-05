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
    });
  });
});
