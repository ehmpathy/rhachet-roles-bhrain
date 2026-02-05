import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { getError, given, then, when } from 'test-fns';

import { stepRouteStoneDel } from './stepRouteStoneDel';

const ASSETS_DIR = path.join(__dirname, '.test/assets');

describe('stepRouteStoneDel', () => {
  given('[case1] stone with no artifact, apply mode', () => {
    const tempDir = path.join(os.tmpdir(), `test-step-del-noart-${Date.now()}`);

    beforeEach(async () => {
      await fs.cp(path.join(ASSETS_DIR, 'route.simple'), tempDir, {
        recursive: true,
      });
    });

    afterEach(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    when('[t0] stone is deleted in apply mode', () => {
      then('removes stone file', async () => {
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
        expect(stoneExists).toBe(false);
      });

      then('returns deleted in result with new contract shape', async () => {
        const result = await stepRouteStoneDel({
          stone: '1.vision',
          route: tempDir,
          mode: 'apply',
        });
        expect(result.deleted).toEqual(['1.vision']);
        expect(result.retained).toEqual([]);
        expect(result.pattern).toBe('*1.vision*');
        expect(result.patternRaw).toBe('1.vision');
        expect(result.stones).toEqual([
          { name: '1.vision', status: 'deleted', reason: null },
        ]);
      });
    });
  });

  given('[case2] stone with artifact present, apply mode', () => {
    const tempDir = path.join(os.tmpdir(), `test-step-del-art-${Date.now()}`);

    beforeEach(async () => {
      await fs.cp(path.join(ASSETS_DIR, 'route.simple'), tempDir, {
        recursive: true,
      });
      // create artifact
      await fs.writeFile(path.join(tempDir, '1.vision.md'), '# Vision');
    });

    afterEach(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    when('[t0] delete is attempted in apply mode', () => {
      then('retains stone and keeps file', async () => {
        const result = await stepRouteStoneDel({
          stone: '1.vision',
          route: tempDir,
          mode: 'apply',
        });
        expect(result.deleted).toEqual([]);
        expect(result.retained).toContain('1.vision');
        expect(result.stones).toEqual([
          { name: '1.vision', status: 'retained', reason: 'artifact found' },
        ]);
      });

      then('stone file still exists', async () => {
        await stepRouteStoneDel({
          stone: '1.vision',
          route: tempDir,
          mode: 'apply',
        });
        const stoneExists = await fs
          .access(path.join(tempDir, '1.vision.stone'))
          .then(() => true)
          .catch(() => false);
        expect(stoneExists).toBe(true);
      });
    });
  });

  given('[case3] glob pattern matches multiple stones, apply mode', () => {
    const tempDir = path.join(os.tmpdir(), `test-step-del-glob-${Date.now()}`);

    beforeEach(async () => {
      await fs.cp(path.join(ASSETS_DIR, 'route.parallel'), tempDir, {
        recursive: true,
      });
    });

    afterEach(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    when('[t0] glob pattern matches multiple stones', () => {
      then('deletes all matched stones without artifacts', async () => {
        const result = await stepRouteStoneDel({
          stone: '3.1.*',
          route: tempDir,
          mode: 'apply',
        });
        expect(result.deleted.length).toBe(3);
        expect(result.deleted.sort()).toEqual([
          '3.1.research.domain',
          '3.1.research.prior',
          '3.1.research.template',
        ]);
      });
    });
  });

  given('[case4] glob pattern matches no stones', () => {
    const tempDir = path.join(
      os.tmpdir(),
      `test-step-del-nomatch-${Date.now()}`,
    );

    beforeEach(async () => {
      await fs.cp(path.join(ASSETS_DIR, 'route.simple'), tempDir, {
        recursive: true,
      });
    });

    afterEach(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    when('[t0] no stones match pattern', () => {
      then('returns empty arrays and message', async () => {
        const result = await stepRouteStoneDel({
          stone: '99.*',
          route: tempDir,
          mode: 'apply',
        });
        expect(result.deleted).toEqual([]);
        expect(result.retained).toEqual([]);
        expect(result.stones).toEqual([]);
        expect(result.emit?.stdout).toContain('no stones matched');
      });
    });
  });

  given('[case5] route not found', () => {
    when('[t0] route path does not exist', () => {
      then('throws route not found error', async () => {
        const error = await getError(
          stepRouteStoneDel({
            stone: '*',
            route: '/nonexistent/path',
            mode: 'apply',
          }),
        );
        expect(error).toBeInstanceOf(Error);
        expect(error.message).toContain('route not found');
      });
    });
  });

  given('[case6] plan mode, stone with no artifact', () => {
    const tempDir = path.join(os.tmpdir(), `test-step-del-plan-${Date.now()}`);

    beforeEach(async () => {
      await fs.cp(path.join(ASSETS_DIR, 'route.simple'), tempDir, {
        recursive: true,
      });
    });

    afterEach(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    when('[t0] plan mode with no artifacts', () => {
      then('no files removed from disk', async () => {
        await stepRouteStoneDel({
          stone: '1.vision',
          route: tempDir,
          mode: 'plan',
        });
        const stoneExists = await fs
          .access(path.join(tempDir, '1.vision.stone'))
          .then(() => true)
          .catch(() => false);
        expect(stoneExists).toBe(true);
      });

      then('stones array has delete status', async () => {
        const result = await stepRouteStoneDel({
          stone: '1.vision',
          route: tempDir,
          mode: 'plan',
        });
        expect(result.deleted).toEqual([]);
        expect(result.stones).toEqual([
          { name: '1.vision', status: 'delete', reason: null },
        ]);
      });
    });
  });

  given('[case7] plan mode, stone with artifact', () => {
    const tempDir = path.join(
      os.tmpdir(),
      `test-step-del-plan-art-${Date.now()}`,
    );

    beforeEach(async () => {
      await fs.cp(path.join(ASSETS_DIR, 'route.simple'), tempDir, {
        recursive: true,
      });
      await fs.writeFile(path.join(tempDir, '1.vision.md'), '# Vision');
    });

    afterEach(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    when('[t0] plan mode with artifact', () => {
      then('stones array has retain status with reason', async () => {
        const result = await stepRouteStoneDel({
          stone: '1.vision',
          route: tempDir,
          mode: 'plan',
        });
        expect(result.stones).toEqual([
          { name: '1.vision', status: 'retain', reason: 'artifact found' },
        ]);
        expect(result.retained).toContain('1.vision');
      });
    });
  });

  given('[case8] fuzzy pattern match', () => {
    const tempDir = path.join(os.tmpdir(), `test-step-del-fuzzy-${Date.now()}`);

    beforeEach(async () => {
      await fs.cp(path.join(ASSETS_DIR, 'route.parallel'), tempDir, {
        recursive: true,
      });
    });

    afterEach(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    when('[t0] plain word "research" with no glob chars', () => {
      then(
        'auto-expands to *research* and matches research stones',
        async () => {
          const result = await stepRouteStoneDel({
            stone: 'research',
            route: tempDir,
            mode: 'plan',
          });
          expect(result.pattern).toBe('*research*');
          expect(result.patternRaw).toBe('research');
          expect(result.stones.length).toBe(3);
          expect(result.stones.map((s) => s.name).sort()).toEqual([
            '3.1.research.domain',
            '3.1.research.prior',
            '3.1.research.template',
          ]);
        },
      );
    });
  });

  given('[case9] emit output format', () => {
    const tempDir = path.join(os.tmpdir(), `test-step-del-emit-${Date.now()}`);

    beforeEach(async () => {
      await fs.cp(path.join(ASSETS_DIR, 'route.parallel'), tempDir, {
        recursive: true,
      });
      // create artifact for one stone
      await fs.writeFile(
        path.join(tempDir, '3.1.research.domain.md'),
        '# Domain',
      );
    });

    afterEach(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    when('[t0] plan mode output', () => {
      then('has treestruct format with header', async () => {
        const result = await stepRouteStoneDel({
          stone: '3.1.*',
          route: tempDir,
          mode: 'plan',
        });
        const stdout = result.emit?.stdout ?? '';
        expect(stdout).toContain(`🦉 hoo needs 'em`);
        expect(stdout).toContain('🗿 route.stone.del --mode plan');
        expect(stdout).toContain('├─ stones');
        expect(stdout).toContain('✓');
        expect(stdout).toContain('⊘');
        expect(stdout).toContain('(delete)');
        expect(stdout).toContain('(retain, artifact found)');
        expect(stdout).toContain('rerun with --mode apply to execute');
      });
    });

    when('[t1] apply mode output', () => {
      then('has treestruct format with header', async () => {
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
        expect(stdout).not.toContain('rerun with --mode apply');
      });
    });
  });
});
