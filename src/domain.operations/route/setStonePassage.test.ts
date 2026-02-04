import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { given, then, when } from 'test-fns';

import { RouteStone } from '@src/domain.objects/Driver/RouteStone';

import { setStonePassage } from './setStonePassage';

describe('setStonePassage', () => {
  given('[case1] a stone to mark as passed', () => {
    const tempDir = path.join(os.tmpdir(), `test-passage-${Date.now()}`);
    const stone = new RouteStone({
      name: '1.vision',
      path: path.join(tempDir, '1.vision.stone'),
      guard: null,
    });

    afterEach(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    when('[t0] passage is set', () => {
      then('creates .route directory if absent', async () => {
        await setStonePassage({ stone, route: tempDir });
        const stat = await fs.stat(path.join(tempDir, '.route'));
        expect(stat.isDirectory()).toBe(true);
      });

      then('creates passage marker file', async () => {
        const result = await setStonePassage({ stone, route: tempDir });
        expect(result.path).toContain('1.vision.passed');
        const stat = await fs.stat(result.path);
        expect(stat.isFile()).toBe(true);
      });
    });
  });

  given('[case2] a stone with .route directory already present', () => {
    const tempDir = path.join(
      os.tmpdir(),
      `test-passage-routedir-${Date.now()}`,
    );
    const stone = new RouteStone({
      name: '2.criteria',
      path: path.join(tempDir, '2.criteria.stone'),
      guard: null,
    });

    beforeEach(async () => {
      await fs.mkdir(path.join(tempDir, '.route'), { recursive: true });
    });

    afterEach(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    when('[t0] passage is set', () => {
      then('succeeds without error', async () => {
        const result = await setStonePassage({ stone, route: tempDir });
        expect(result.path).toContain('2.criteria.passed');
      });
    });
  });
});
