import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { given, then, when } from 'test-fns';

import { stepRouteStoneDel } from './stepRouteStoneDel';

const ASSETS_DIR = path.join(__dirname, '.test/assets');

describe('stepRouteStoneDel.integration', () => {
  given('[case1] route with guard files, apply mode', () => {
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
          mode: 'apply',
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

  given('[case2] route.parallel with partial completion, apply mode', () => {
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

    when('[t0] delete 3.1.* stones in apply mode', () => {
      then('deletes stones without artifacts', async () => {
        const result = await stepRouteStoneDel({
          stone: '3.1.*',
          route: tempDir,
          mode: 'apply',
        });
        expect(result.deleted).toContain('3.1.research.prior');
        expect(result.deleted).toContain('3.1.research.template');
        expect(result.deleted).not.toContain('3.1.research.domain');
      });

      then('retains stone with artifact', async () => {
        const result = await stepRouteStoneDel({
          stone: '3.1.*',
          route: tempDir,
          mode: 'apply',
        });
        expect(result.retained).toContain('3.1.research.domain');
      });

      then('emits treestruct with header', async () => {
        const result = await stepRouteStoneDel({
          stone: '3.1.*',
          route: tempDir,
          mode: 'apply',
        });
        const stdout = result.emit?.stdout ?? '';
        expect(stdout).toContain(`🦉 hoo needs 'em`);
        expect(stdout).toContain('🗿 route.stone.del --mode apply');
        expect(stdout).toContain('(deleted)');
        expect(stdout).toContain('(retained, artifact found)');
      });
    });
  });

  given('[case3] route.alternate with different extensions, apply mode', () => {
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
          mode: 'apply',
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
          mode: 'apply',
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

  given('[case4] plan mode on route.parallel with partial completion', () => {
    const tempDir = path.join(
      os.tmpdir(),
      `test-step-del-plan-int-${Date.now()}`,
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

    when('[t0] plan mode for 3.1.* stones', () => {
      then('no disk changes', async () => {
        await stepRouteStoneDel({
          stone: '3.1.*',
          route: tempDir,
          mode: 'plan',
        });

        // all stone files should still exist
        const domainExists = await fs
          .access(path.join(tempDir, '3.1.research.domain.stone'))
          .then(() => true)
          .catch(() => false);
        const priorExists = await fs
          .access(path.join(tempDir, '3.1.research.prior.stone'))
          .then(() => true)
          .catch(() => false);
        const templateExists = await fs
          .access(path.join(tempDir, '3.1.research.template.stone'))
          .then(() => true)
          .catch(() => false);
        expect(domainExists).toBe(true);
        expect(priorExists).toBe(true);
        expect(templateExists).toBe(true);
      });

      then('stones classified correctly', async () => {
        const result = await stepRouteStoneDel({
          stone: '3.1.*',
          route: tempDir,
          mode: 'plan',
        });
        const stoneByName = Object.fromEntries(
          result.stones.map((s) => [s.name, s]),
        );
        expect(stoneByName['3.1.research.domain']?.status).toBe('retain');
        expect(stoneByName['3.1.research.domain']?.reason).toBe(
          'artifact found',
        );
        expect(stoneByName['3.1.research.prior']?.status).toBe('delete');
        expect(stoneByName['3.1.research.template']?.status).toBe('delete');
      });

      then('emits treestruct with plan header', async () => {
        const result = await stepRouteStoneDel({
          stone: '3.1.*',
          route: tempDir,
          mode: 'plan',
        });
        const stdout = result.emit?.stdout ?? '';
        expect(stdout).toContain(`🦉 hoo needs 'em`);
        expect(stdout).toContain('🗿 route.stone.del --mode plan');
        expect(stdout).toContain('rerun with --mode apply to execute');
      });
    });
  });
});
