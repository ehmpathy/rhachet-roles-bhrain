import * as path from 'path';

import { given, then, useThen, when } from 'test-fns';

import {
  execAsync,
  genTempDirForReflector,
  invokeReflectSkill,
  sanitizeReflectOutputForSnapshot,
} from './.test/invokeReflectSkill';

const ASSETS_DIR = path.join(__dirname, '.test/assets/reflect-snapshot');

describe('reflect.snapshot.backup', () => {
  /**
   * .what = a backup with no --into target
   * .why = the refusal is the whole contract here: no s3 call is made, so the
   *        stderr text is what tells the caller which flag to add
   */
  given('[case1] backup is invoked with no --into', () => {
    when('[t0] backup is invoked', () => {
      const result = useThen('skill invocation fails', async () => {
        const tempDir = genTempDirForReflector({
          slug: 'reflect-backup-no-into',
          clone: ASSETS_DIR,
        });
        await execAsync('npx rhachet roles link --role reflector', {
          cwd: tempDir,
        });
        return invokeReflectSkill({
          skill: 'reflect.snapshot',
          subcommand: 'backup',
          cwd: tempDir,
        });
      });

      then('exit code is 2 — an absent target is the caller`s to fix', () => {
        expect(result.code).toEqual(2);
      });

      then('the error lands on stderr, named as a constraint', () => {
        expect(result.stderr).toContain(
          '✋ ConstraintError: --into s3://bucket required',
        );
      });

      then('the refusal renders whole', () => {
        expect(sanitizeReflectOutputForSnapshot(result.stderr)).toMatchSnapshot();
      });
    });
  });

  /**
   * .what = a backup with a target that is not an s3 uri
   * .why = the uri check fires before any aws call, so the refusal must wear the
   *        reflect frame and name the fix, never a raw stack
   */
  given('[case2] backup is invoked with a non-s3 --into', () => {
    when('[t0] backup is invoked', () => {
      const result = useThen('skill invocation fails', async () => {
        const tempDir = genTempDirForReflector({
          slug: 'reflect-backup-bad-uri',
          clone: ASSETS_DIR,
        });
        await execAsync('npx rhachet roles link --role reflector', {
          cwd: tempDir,
        });
        return invokeReflectSkill({
          skill: 'reflect.snapshot',
          subcommand: 'backup',
          args: { into: 'https://not-s3' },
          cwd: tempDir,
        });
      });

      then('exit code is 2 — a bad uri is the caller`s to fix', () => {
        expect(result.code).toEqual(2);
      });

      then('the error lands on stderr, named as a constraint', () => {
        expect(result.stderr).toContain(
          '✋ ConstraintError: s3 uri must start with s3://',
        );
      });

      then('no stack frame reaches the caller', () => {
        expect(result.stderr).not.toContain('    at ');
      });

      then('the refusal renders whole', () => {
        expect(sanitizeReflectOutputForSnapshot(result.stderr)).toMatchSnapshot();
      });
    });
  });
});
