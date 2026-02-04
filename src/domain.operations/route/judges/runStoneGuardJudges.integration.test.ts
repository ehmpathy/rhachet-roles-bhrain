import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { given, then, when } from 'test-fns';

import { RouteStone } from '@src/domain.objects/Driver/RouteStone';
import { RouteStoneGuard } from '@src/domain.objects/Driver/RouteStoneGuard';

import { runStoneGuardJudges } from './runStoneGuardJudges';

describe('runStoneGuardJudges', () => {
  given('[case1] guard with echo judge command that passes', () => {
    const tempDir = path.join(os.tmpdir(), `test-judges-pass-${Date.now()}`);
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

    beforeEach(async () => {
      await fs.mkdir(tempDir, { recursive: true });
    });

    afterEach(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    when('[t0] judges are executed', () => {
      then('creates judge artifact file', async () => {
        const judges = await runStoneGuardJudges({
          stone,
          guard,
          hash: 'testhash',
          iteration: 1,
          route: tempDir,
        });
        expect(judges).toHaveLength(1);

        // filename format: $stone.guard.judge.i$rp$j.$reviewHash.$judgeHash.j$index.md
        expect(judges[0]?.path).toContain('.guard.judge.i1p1.testhash.');
        expect(judges[0]?.path).toContain('.j1.md');
        const stat = await fs.stat(judges[0]?.path ?? '');
        expect(stat.isFile()).toBe(true);
      });

      then('parses passed status', async () => {
        const judges = await runStoneGuardJudges({
          stone,
          guard,
          hash: 'testhash',
          iteration: 1,
          route: tempDir,
        });
        expect(judges[0]?.passed).toEqual(true);
      });

      then('parses reason', async () => {
        const judges = await runStoneGuardJudges({
          stone,
          guard,
          hash: 'testhash',
          iteration: 1,
          route: tempDir,
        });
        expect(judges[0]?.reason).toEqual('all checks passed');
      });
    });
  });

  given('[case2] guard with judge command that fails', () => {
    const tempDir = path.join(os.tmpdir(), `test-judges-fail-${Date.now()}`);
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

    beforeEach(async () => {
      await fs.mkdir(tempDir, { recursive: true });
    });

    afterEach(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    when('[t0] judges are executed', () => {
      then('parses failed status', async () => {
        const judges = await runStoneGuardJudges({
          stone,
          guard,
          hash: 'failhash',
          iteration: 1,
          route: tempDir,
        });
        expect(judges[0]?.passed).toEqual(false);
        expect(judges[0]?.reason).toEqual('blockers found');
      });
    });
  });

  given('[case3] guard with multiple judge commands', () => {
    const tempDir = path.join(os.tmpdir(), `test-judges-multi-${Date.now()}`);
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

    beforeEach(async () => {
      await fs.mkdir(tempDir, { recursive: true });
    });

    afterEach(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    when('[t0] judges are executed', () => {
      then('creates artifact for each judge', async () => {
        const judges = await runStoneGuardJudges({
          stone,
          guard,
          hash: 'multihash',
          iteration: 1,
          route: tempDir,
        });
        expect(judges).toHaveLength(2);
        expect(judges[0]?.index).toEqual(1);
        expect(judges[0]?.passed).toEqual(true);
        expect(judges[1]?.index).toEqual(2);
        expect(judges[1]?.passed).toEqual(false);
      });
    });
  });
});
