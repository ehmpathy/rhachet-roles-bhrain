import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { given, then, when } from 'test-fns';

import { RouteStone } from '@src/domain.objects/Driver/RouteStone';
import { RouteStoneGuard } from '@src/domain.objects/Driver/RouteStoneGuard';

import { delStone } from './delStone';

describe('delStone', () => {
  given('[case1] a stone without guard and no artifact', () => {
    const tempDir = path.join(os.tmpdir(), `test-del-stone-${Date.now()}`);
    const stonePath = path.join(tempDir, '1.vision.stone');

    beforeEach(async () => {
      await fs.mkdir(tempDir, { recursive: true });
      await fs.writeFile(stonePath, 'stone content');
    });

    afterEach(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    when('[t0] stone is deleted', () => {
      then('removes stone file', async () => {
        const stone = new RouteStone({
          name: '1.vision',
          path: stonePath,
          guard: null,
        });
        await delStone({ stone, route: tempDir });

        await expect(fs.access(stonePath)).rejects.toThrow();
      });
    });
  });

  given('[case2] a stone with guard and no artifact', () => {
    const tempDir = path.join(
      os.tmpdir(),
      `test-del-stone-guarded-${Date.now()}`,
    );
    const stonePath = path.join(tempDir, '1.vision.stone');
    const guardPath = path.join(tempDir, '1.vision.guard');

    beforeEach(async () => {
      await fs.mkdir(tempDir, { recursive: true });
      await fs.writeFile(stonePath, 'stone content');
      await fs.writeFile(guardPath, 'artifacts:\n  - 1.vision*.md');
    });

    afterEach(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    when('[t0] stone is deleted', () => {
      then('removes stone file', async () => {
        const stone = new RouteStone({
          name: '1.vision',
          path: stonePath,
          guard: new RouteStoneGuard({
            path: guardPath,
            artifacts: ['1.vision*.md'],
            reviews: [],
            judges: [],
          }),
        });
        await delStone({ stone, route: tempDir });

        await expect(fs.access(stonePath)).rejects.toThrow();
      });

      then('removes guard file', async () => {
        const stone = new RouteStone({
          name: '1.vision',
          path: stonePath,
          guard: new RouteStoneGuard({
            path: guardPath,
            artifacts: ['1.vision*.md'],
            reviews: [],
            judges: [],
          }),
        });
        await delStone({ stone, route: tempDir });

        await expect(fs.access(guardPath)).rejects.toThrow();
      });
    });
  });

  given('[case3] a stone with artifact present', () => {
    const tempDir = path.join(
      os.tmpdir(),
      `test-del-stone-artifact-${Date.now()}`,
    );
    const stonePath = path.join(tempDir, '1.vision.stone');
    const artifactPath = path.join(tempDir, '1.vision.md');

    beforeEach(async () => {
      await fs.mkdir(tempDir, { recursive: true });
      await fs.writeFile(stonePath, 'stone content');
      await fs.writeFile(artifactPath, '# Vision\nartifact content');
    });

    afterEach(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    when('[t0] deletion is attempted', () => {
      then('throws error: cannot del; artifact found', async () => {
        const stone = new RouteStone({
          name: '1.vision',
          path: stonePath,
          guard: null,
        });

        await expect(delStone({ stone, route: tempDir })).rejects.toThrow(
          'cannot del; artifact found',
        );
      });

      then('stone file is preserved', async () => {
        const stone = new RouteStone({
          name: '1.vision',
          path: stonePath,
          guard: null,
        });

        try {
          await delStone({ stone, route: tempDir });
        } catch {
          // expected
        }

        // stone should still exist
        await expect(fs.access(stonePath)).resolves.toBeUndefined();
      });
    });
  });
});
