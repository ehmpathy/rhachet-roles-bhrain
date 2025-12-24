import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';

import { createDraftDirectory } from './createDraftDirectory';

describe('createDraftDirectory', () => {
  const testDir = path.join(os.tmpdir(), `reflect-test-draft-${Date.now()}`);

  afterEach(async () => {
    await fs.rm(testDir, { recursive: true, force: true });
  });

  describe('directory creation', () => {
    it('should create draft directory structure', async () => {
      const result = await createDraftDirectory({ targetDir: testDir });

      expect(result.draftDir).toContain('.draft/v');
      expect(result.pureDir).toContain('/pure');
      expect(result.syncDir).toContain('/sync');
    });

    it('should create pure subdirectory', async () => {
      const result = await createDraftDirectory({ targetDir: testDir });
      const stat = await fs.stat(result.pureDir);
      expect(stat.isDirectory()).toBe(true);
    });

    it('should create sync subdirectory', async () => {
      const result = await createDraftDirectory({ targetDir: testDir });
      const stat = await fs.stat(result.syncDir);
      expect(stat.isDirectory()).toBe(true);
    });

    it('should use timestamp in directory name', async () => {
      const result = await createDraftDirectory({ targetDir: testDir });
      expect(result.draftDir).toMatch(/v\d{4}-\d{2}-\d{2}T/);
    });
  });

  describe('idempotency', () => {
    it('should create unique directories on multiple calls', async () => {
      const result1 = await createDraftDirectory({ targetDir: testDir });
      await new Promise((resolve) => setTimeout(resolve, 10)); // small delay
      const result2 = await createDraftDirectory({ targetDir: testDir });

      expect(result1.draftDir).not.toBe(result2.draftDir);
    });
  });
});
