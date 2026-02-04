import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { given, then, when } from 'test-fns';

import { stepRouteStoneDel } from './stepRouteStoneDel';

const ASSETS_DIR = path.join(__dirname, '.test/assets');

describe('stepRouteStoneDel.integration', () => {
  given('[case1] route with guard files', () => {
    const tempDir = path.join(os.tmpdir(), `test-step-del-guard-${Date.now()}`);

    beforeEach(async () => {
      await fs.cp(path.join(ASSETS_DIR, 'route.guarded'), tempDir, {
        recursive: true,
      });
    });

    afterEach(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    when('[t0] stone with guard is deleted', () => {
      then('removes both stone and guard files', async () => {
        const result = await stepRouteStoneDel({
          stone: '1.vision',
          route: tempDir,
        });
        expect(result.deleted).toContain('1.vision');

        const stoneExists = await fs
          .access(path.join(tempDir, '1.vision.stone'))
          .then(() => true)
          .catch(() => false);
        const guardExists = await fs
          .access(path.join(tempDir, '1.vision.guard'))
          .then(() => true)
          .catch(() => false);
        expect(stoneExists).toBe(false);
        expect(guardExists).toBe(false);
      });
    });
  });

  given('[case2] route.parallel with partial completion', () => {
    const tempDir = path.join(
      os.tmpdir(),
      `test-step-del-partial-${Date.now()}`,
    );

    beforeEach(async () => {
      await fs.cp(path.join(ASSETS_DIR, 'route.parallel'), tempDir, {
        recursive: true,
      });
      // create artifact for one research stone
      await fs.writeFile(
        path.join(tempDir, '3.1.research.domain.md'),
        '# Domain',
      );
    });

    afterEach(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    when('[t0] delete 3.1.* stones', () => {
      then('deletes stones without artifacts', async () => {
        const result = await stepRouteStoneDel({
          stone: '3.1.*',
          route: tempDir,
        });
        expect(result.deleted).toContain('3.1.research.prior');
        expect(result.deleted).toContain('3.1.research.template');
        expect(result.deleted).not.toContain('3.1.research.domain');
      });

      then('skips stone with artifact', async () => {
        const result = await stepRouteStoneDel({
          stone: '3.1.*',
          route: tempDir,
        });
        expect(result.skipped).toContain('3.1.research.domain');
      });

      then('emits summary with deleted and skipped', async () => {
        const result = await stepRouteStoneDel({
          stone: '3.1.*',
          route: tempDir,
        });
        expect(result.emit?.stdout).toContain('deleted:');
        expect(result.emit?.stdout).toContain('skipped');
      });
    });
  });

  given('[case3] route.alternate with different extensions', () => {
    const tempDir = path.join(os.tmpdir(), `test-step-del-alt-${Date.now()}`);

    beforeEach(async () => {
      await fs.cp(path.join(ASSETS_DIR, 'route.alternate'), tempDir, {
        recursive: true,
      });
      // remove artifact so we can delete
      await fs.rm(path.join(tempDir, '1.vision.md'));
    });

    afterEach(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    when('[t0] delete stone with .src.stone extension', () => {
      then('removes .src.stone and .src.guard files', async () => {
        const result = await stepRouteStoneDel({
          stone: '1.vision',
          route: tempDir,
        });
        expect(result.deleted).toContain('1.vision');

        const stoneExists = await fs
          .access(path.join(tempDir, '1.vision.src.stone'))
          .then(() => true)
          .catch(() => false);
        const guardExists = await fs
          .access(path.join(tempDir, '1.vision.src.guard'))
          .then(() => true)
          .catch(() => false);
        expect(stoneExists).toBe(false);
        expect(guardExists).toBe(false);
      });
    });

    when('[t1] delete stone with .src extension', () => {
      then('removes .src and .stone.guard files', async () => {
        const result = await stepRouteStoneDel({
          stone: '2.criteria',
          route: tempDir,
        });
        expect(result.deleted).toContain('2.criteria');

        const stoneExists = await fs
          .access(path.join(tempDir, '2.criteria.src'))
          .then(() => true)
          .catch(() => false);
        const guardExists = await fs
          .access(path.join(tempDir, '2.criteria.stone.guard'))
          .then(() => true)
          .catch(() => false);
        expect(stoneExists).toBe(false);
        expect(guardExists).toBe(false);
      });
    });
  });
});
