import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { getError, given, then, when } from 'test-fns';

import { stepRouteStoneDel } from './stepRouteStoneDel';

const ASSETS_DIR = path.join(__dirname, '.test/assets');

describe('stepRouteStoneDel', () => {
  given('[case1] stone with no artifact', () => {
    const tempDir = path.join(os.tmpdir(), `test-step-del-noart-${Date.now()}`);

    beforeEach(async () => {
      await fs.cp(path.join(ASSETS_DIR, 'route.simple'), tempDir, {
        recursive: true,
      });
    });

    afterEach(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    when('[t0] stone is deleted', () => {
      then('removes stone file', async () => {
        const result = await stepRouteStoneDel({
          stone: '1.vision',
          route: tempDir,
        });
        expect(result.deleted).toContain('1.vision');
        const stoneExists = await fs
          .access(path.join(tempDir, '1.vision.stone'))
          .then(() => true)
          .catch(() => false);
        expect(stoneExists).toBe(false);
      });

      then('returns deleted in result', async () => {
        const result = await stepRouteStoneDel({
          stone: '1.vision',
          route: tempDir,
        });
        expect(result.deleted).toEqual(['1.vision']);
        expect(result.skipped).toEqual([]);
      });
    });
  });

  given('[case2] stone with artifact present', () => {
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

    when('[t0] delete is attempted', () => {
      then('skips stone and keeps file', async () => {
        const result = await stepRouteStoneDel({
          stone: '1.vision',
          route: tempDir,
        });
        expect(result.deleted).toEqual([]);
        expect(result.skipped).toContain('1.vision');
      });

      then('stone file still exists', async () => {
        await stepRouteStoneDel({ stone: '1.vision', route: tempDir });
        const stoneExists = await fs
          .access(path.join(tempDir, '1.vision.stone'))
          .then(() => true)
          .catch(() => false);
        expect(stoneExists).toBe(true);
      });
    });
  });

  given('[case3] glob pattern matches multiple stones', () => {
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
        });
        expect(result.deleted).toEqual([]);
        expect(result.skipped).toEqual([]);
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
          }),
        );
        expect(error).toBeInstanceOf(Error);
        expect(error.message).toContain('route not found');
      });
    });
  });
});
