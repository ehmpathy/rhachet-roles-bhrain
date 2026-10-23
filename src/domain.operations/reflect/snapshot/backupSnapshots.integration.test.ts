import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { getError, given, then, when } from 'test-fns';

import { backupSnapshots } from './backupSnapshots';

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
      then('should throw BadRequestError about source', async () => {
        const error = await getError(async () =>
          backupSnapshots({
            sourceDir: '/tmp/definitely-does-not-exist-abc123',
            into: 's3://test-bucket',
          }),
        );
        expect(error).toBeDefined();
        expect(error.message).toContain('source directory does not exist');
      });
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
      then('should throw BadRequestError about credentials', async () => {
        // force the absent-credential state on any host: no aws cli on PATH, so the
        // credential probe fails and no real s3 sync is ever attempted
        const pathBefore = process.env.PATH;
        process.env.PATH = '/nonexistent-backup-snapshots-test-path';
        const error = await getError(async () =>
          backupSnapshots({
            sourceDir: tempDir,
            into: 's3://test-bucket',
          }),
        ).finally(() => {
          process.env.PATH = pathBefore;
        });
        expect(error).toBeDefined();
        expect(error.message).toContain('aws credentials not found');
      });
    });

    // note: actual s3 sync test requires real bucket access
    // better suited for manual smoke test
  });
});
