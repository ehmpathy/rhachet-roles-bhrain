import { execSync } from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { getError, given, then, when } from 'test-fns';

import { backupSnapshots } from './backupSnapshots';

/**
 * .what = checks if aws credentials are available
 * .why = skip tests that require aws if not configured
 */
const hasAwsCredentials = (): boolean => {
  try {
    execSync('aws sts get-caller-identity', { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
};

describe('backupSnapshots', () => {
  given('[case1] invalid s3 uri', () => {
    when('[t0] backup is attempted with non-s3 uri', () => {
      then('should throw BadRequestError', async () => {
        const error = await getError(async () =>
          backupSnapshots({
            sourceDir: '/tmp/nonexistent',
            into: 'https://not-s3.com/bucket',
          }),
        );
        expect(error).toBeDefined();
        expect(error.message).toContain('s3 uri must start with s3://');
      });
    });
  });

  given('[case2] source directory does not exist', () => {
    when('[t0] backup is attempted', () => {
      then.skipIf(!hasAwsCredentials())(
        'should throw BadRequestError about source',
        async () => {
          const error = await getError(async () =>
            backupSnapshots({
              sourceDir: '/tmp/definitely-does-not-exist-abc123',
              into: 's3://test-bucket',
            }),
          );
          expect(error).toBeDefined();
          expect(error.message).toContain('source directory does not exist');
        },
      );
    });
  });

  given('[case3] valid source directory', () => {
    const tempDir = path.join(os.tmpdir(), `backup-test-${Date.now()}`);

    beforeAll(() => {
      // create temp dir with some files
      fs.mkdirSync(tempDir, { recursive: true });
      fs.writeFileSync(path.join(tempDir, 'file1.txt'), 'content1');
      fs.writeFileSync(path.join(tempDir, 'file2.txt'), 'content2');
    });

    afterAll(() => {
      fs.rmSync(tempDir, { recursive: true, force: true });
    });

    when('[t0] backup is attempted without aws credentials', () => {
      then.skipIf(hasAwsCredentials())(
        'should throw BadRequestError about credentials',
        async () => {
          const error = await getError(async () =>
            backupSnapshots({
              sourceDir: tempDir,
              into: 's3://test-bucket',
            }),
          );
          expect(error).toBeDefined();
          expect(error.message).toContain('aws credentials not found');
        },
      );
    });

    // note: actual s3 sync test requires real bucket access
    // better suited for manual smoke test
  });
});
