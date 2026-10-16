import * as fs from 'fs';
import { ConstraintError } from 'helpful-errors';
import * as os from 'os';
import * as path from 'path';
import { getError, given, then, useThen, when } from 'test-fns';

import { backupSnapshots } from './backupSnapshots';

/**
 * .what = scopes "no aws credentials" to the block that calls it
 * .why = the credential check shells out to the aws cli, which reads the env. a profile
 *        that cannot exist, with no static keys, makes "absent credentials" a fact of the
 *        block rather than of the host — so a case runs on every machine, never skips on
 *        one that happens to hold credentials or lack them
 */
const useAwsCredentialsAbsent = (): void => {
  const ENV_KEYS_OF_AWS = [
    'AWS_PROFILE',
    'AWS_ACCESS_KEY_ID',
    'AWS_SECRET_ACCESS_KEY',
    'AWS_SESSION_TOKEN',
  ] as const;
  const envBefore = Object.fromEntries(
    ENV_KEYS_OF_AWS.map((key) => [key, process.env[key]]),
  );
  beforeAll(() => {
    ENV_KEYS_OF_AWS.forEach((key) => delete process.env[key]);
    process.env.AWS_PROFILE = 'bhrain-test-profile-that-cannot-exist';
  });
  afterAll(() => {
    ENV_KEYS_OF_AWS.forEach((key) => {
      const value = envBefore[key];
      if (value === undefined) return void delete process.env[key];
      process.env[key] = value;
    });
  });
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
    when('[t0] backup is attempted without aws credentials', () => {
      // .why = the source check precedes the credential check, so a bad source is named
      //        even where aws access is absent — the caller learns the cheaper fix first
      useAwsCredentialsAbsent();

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
      useAwsCredentialsAbsent();

      const refusal = useThen('the backup refuses', async () => ({
        error: await getError(async () =>
          backupSnapshots({
            sourceDir: tempDir,
            into: 's3://test-bucket',
          }),
        ),
      }));

      then('should throw BadRequestError about credentials', () => {
        expect(refusal.error).toBeDefined();
        expect(refusal.error.message).toContain('aws credentials not found');
      });

      // the refusal a human meets: its class (exit 2) and its whole fix line (i017 r013 n1)
      then('it is a constraint that names the whole fix', () => {
        expect(refusal.error).toBeInstanceOf(ConstraintError);
        expect(refusal.error.message).toContain(
          'aws credentials not found. run `aws configure` or set AWS_PROFILE',
        );
      });
    });

    when('[t1] backup is attempted where no aws cli is on PATH', () => {
      // an empty PATH makes the shell exit 127, so "no cli" is a fact of the block
      const pathBefore = process.env.PATH;
      beforeAll(() => {
        process.env.PATH = '/bhrain-test-path-that-cannot-exist';
      });
      afterAll(() => {
        process.env.PATH = pathBefore;
      });

      const refusal = useThen('the backup refuses', async () => ({
        error: await getError(async () =>
          backupSnapshots({
            sourceDir: tempDir,
            into: 's3://test-bucket',
          }),
        ),
      }));

      then('it names the absent cli, not a credential fault', () => {
        expect(refusal.error.message).toContain('aws cli not found');
        expect(refusal.error.message).not.toContain('credentials not found');
      });

      // the refusal a human meets: its class (exit 2) and its whole fix line (i017 r013 n1)
      then('it is a constraint that names the whole fix', () => {
        expect(refusal.error).toBeInstanceOf(ConstraintError);
        expect(refusal.error.message).toContain(
          'aws cli not found. install it, then run `aws configure`',
        );
      });
    });

    when(
      '[t2] a source whose name holds shell syntax and whose tree holds a lost link',
      () => {
        /**
         * .mock = the aws cli, as an executable on PATH that records the argv it was handed
         * .why = this case grades the argv OUR code builds — the shell word of each path —
         *        which is the boundary this module owns. a real sync needs a bucket grant only a
         *        human can make (the gap below), and would not show the argv at all
         * .real = the real sync path is the gap named below
         */
        const fakeDir = path.join(os.tmpdir(), `backup-fake-aws-${Date.now()}`);
        const argvAt = path.join(fakeDir, 'argv.txt');
        const sourceDir = path.join(tempDir, 'snap $USER `id` "q" \'s\'');
        const pathBefore = process.env.PATH;
        beforeAll(() => {
          fs.mkdirSync(fakeDir, { recursive: true });
          fs.writeFileSync(
            path.join(fakeDir, 'aws'),
            [
              '#!/bin/sh',
              'if [ "$1" = "s3" ]; then printf \'%s\\n\' "$@" > "$BHRAIN_TEST_AWS_ARGV"; fi',
              'exit 0',
            ].join('\n'),
            { mode: 0o755 },
          );
          fs.mkdirSync(sourceDir, { recursive: true });
          fs.writeFileSync(path.join(sourceDir, 'kept.txt'), 'kept');
          fs.symlinkSync(
            path.join(sourceDir, 'gone.txt'),
            path.join(sourceDir, 'lost.txt'),
          );
          process.env.PATH = fakeDir;
          process.env.BHRAIN_TEST_AWS_ARGV = argvAt;
        });
        afterAll(() => {
          process.env.PATH = pathBefore;
          delete process.env.BHRAIN_TEST_AWS_ARGV;
          fs.rmSync(fakeDir, { recursive: true, force: true });
        });

        const result = useThen('the backup completes', () =>
          backupSnapshots({ sourceDir, into: 's3://test-bucket' }),
        );

        // 🔴 red before the fix: the double-quoted word let the shell expand `$USER` and
        //    `id`, and the inner quote broke the command (i018 r010 nitpick.2)
        then('aws receives each path literally, as one argument', () => {
          const argv = fs.readFileSync(argvAt, 'utf-8').split('\n');
          expect(argv.slice(0, 2)).toEqual(['s3', 'sync']);
          expect(argv[2]).toEqual(sourceDir);
          expect(argv[3]).toEqual(result.targetUri);
        });

        // 🔴 red before the fix: the stat of a link whose target is gone threw a bare ENOENT
        //    and aborted the backup (i018 r010 nitpick.1)
        then('an entry gone at read time is skipped, never an abort', () => {
          expect(result.fileCount).toEqual(1);
          expect(result.totalBytes).toEqual('kept'.length);
        });
      },
    );

    // 🔴 gap, not a carve-out: the real `aws s3 sync` success path is untested. it owes one
    //    `then` that syncs this temp dir to a test bucket and lists the prefix — and that
    //    `then` waits on an AWS test credential plus a bucket in the keyrack's env.test,
    //    which only a human can grant (`rhx keyrack fill --owner ehmpath`)
  });
});
