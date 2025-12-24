import * as fs from 'fs/promises';
import * as os from 'os';
import { getError } from 'test-fns';

import { validateTargetDirectory } from './validateTargetDirectory';

describe('validateTargetDirectory', () => {
  describe('existing directory', () => {
    it('should return created=false when directory exists', async () => {
      const result = await validateTargetDirectory({
        target: os.tmpdir(),
      });
      expect(result.created).toBe(false);
    });
  });

  describe('non-existing directory without force', () => {
    it('should throw when directory does not exist and force is false', async () => {
      const error = await getError(
        validateTargetDirectory({
          target: `/tmp/reflect-test-nonexistent-${Date.now()}`,
          force: false,
        }),
      );
      expect(error).toBeDefined();
      expect(error.message).toContain('does not exist');
      expect(error.message).toContain('--force');
    });
  });

  describe('non-existing directory with force', () => {
    const testDir = `/tmp/reflect-test-${Date.now()}`;

    afterEach(async () => {
      await fs.rm(testDir, { recursive: true, force: true });
    });

    it('should create directory when force is true', async () => {
      const result = await validateTargetDirectory({
        target: testDir,
        force: true,
      });
      expect(result.created).toBe(true);

      const stat = await fs.stat(testDir);
      expect(stat.isDirectory()).toBe(true);
    });
  });

  describe('path is a file', () => {
    const testFile = `/tmp/reflect-test-file-${Date.now()}.txt`;

    beforeEach(async () => {
      await fs.writeFile(testFile, 'test', 'utf-8');
    });

    afterEach(async () => {
      await fs.rm(testFile, { force: true });
    });

    it('should throw when path is a file not a directory', async () => {
      const error = await getError(
        validateTargetDirectory({
          target: testFile,
        }),
      );
      expect(error).toBeDefined();
      expect(error.message).toContain('not a directory');
    });
  });
});
