import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { getError, given, then, when } from 'test-fns';

import { setStoneAsApproved } from './setStoneAsApproved';

const ASSETS_DIR = path.join(__dirname, '../.test/assets');

describe('setStoneAsApproved', () => {
  given('[case1] route.simple fixture', () => {
    const tempDir = path.join(
      os.tmpdir(),
      `test-set-approved-simple-${Date.now()}`,
    );

    beforeEach(async () => {
      await fs.cp(path.join(ASSETS_DIR, 'route.simple'), tempDir, {
        recursive: true,
      });
    });

    afterEach(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    when('[t0] stone is approved', () => {
      then('returns approved true', async () => {
        const result = await setStoneAsApproved({
          stone: '1.vision',
          route: tempDir,
        });
        expect(result.approved).toBe(true);
        expect(result.emit?.stdout).toContain('approval = granted');
      });

      then('creates approval marker', async () => {
        await setStoneAsApproved({ stone: '1.vision', route: tempDir });
        const approvalExists = await fs
          .access(path.join(tempDir, '.route', '1.vision.approved'))
          .then(() => true)
          .catch(() => false);
        expect(approvalExists).toBe(true);
      });
    });

    when('[t1] stone does not exist', () => {
      then('throws stone not found error', async () => {
        const error = await getError(
          setStoneAsApproved({ stone: 'nonexistent', route: tempDir }),
        );
        expect(error).toBeInstanceOf(Error);
        expect(error.message).toContain('stone not found');
      });
    });
  });

  given('[case2] glob pattern match', () => {
    const tempDir = path.join(
      os.tmpdir(),
      `test-set-approved-glob-${Date.now()}`,
    );

    beforeEach(async () => {
      await fs.cp(path.join(ASSETS_DIR, 'route.simple'), tempDir, {
        recursive: true,
      });
    });

    afterEach(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    when('[t0] glob pattern matches stone', () => {
      then('approves matched stone', async () => {
        const result = await setStoneAsApproved({
          stone: '1.*',
          route: tempDir,
        });
        expect(result.approved).toBe(true);
      });
    });

    when('[t1] glob pattern matches no stone', () => {
      then('throws stone not found error', async () => {
        const error = await getError(
          setStoneAsApproved({ stone: '99.*', route: tempDir }),
        );
        expect(error).toBeInstanceOf(Error);
        expect(error.message).toContain('stone not found');
      });
    });
  });
});
