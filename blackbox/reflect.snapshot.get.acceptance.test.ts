import * as path from 'path';

import { given, then, useThen, when } from 'test-fns';

import {
  execAsync,
  genTempDirForReflector,
  invokeReflectSkill,
  sanitizeReflectOutputForSnapshot,
} from './.test/invokeReflectSkill';

const ASSETS_DIR = path.join(__dirname, '.test/assets/reflect-snapshot');

describe('reflect.snapshot.get', () => {
  given('[case1] repo with no snapshots', () => {
    when('[t0] get is invoked', () => {
      const res = useThen('skill invocation succeeds', async () => {
        const tempDir = genTempDirForReflector({
          slug: 'reflect-get-case1',
          clone: ASSETS_DIR,
        });

        await execAsync('npx rhachet roles link --role reflector', {
          cwd: tempDir,
        });

        const cli = await invokeReflectSkill({
          skill: 'reflect.snapshot',
          subcommand: 'get',
          cwd: tempDir,
        });

        return { cli, tempDir };
      });

      then('exit code is 0', () => {
        expect(res.cli.code).toEqual(0);
      });

      then('output contains owl header', () => {
        expect(res.cli.stdout).toContain('know thyself');
      });

      then('output shows snapshots = 0', () => {
        expect(res.cli.stdout).toMatch(/snapshots\s*=\s*0/);
      });

      then('output matches snapshot', () => {
        expect(sanitizeReflectOutputForSnapshot(res.cli.stdout)).toMatchSnapshot();
      });
    });

    when('[t1] get with --at invalid timestamp', () => {
      const res = useThen('skill invocation fails', async () => {
        const tempDir = genTempDirForReflector({
          slug: 'reflect-get-invalid',
          clone: ASSETS_DIR,
        });

        await execAsync('npx rhachet roles link --role reflector', {
          cwd: tempDir,
        });

        const cli = await invokeReflectSkill({
          skill: 'reflect.snapshot',
          subcommand: 'get',
          args: { at: '1999-01-01.000000' },
          cwd: tempDir,
        });

        return { cli, tempDir };
      });

      // .retired = this case once asserted `exit code is non-zero` and `error mentions not
      //            found` over stdout + stderr. retired on purpose: a bad --at is a constraint,
      //            so it exits 2 and lands on stderr alone (rule.require.exit-code-semantics,
      //            rule.forbid.stdout-on-exit-errors). each new assertion is narrower, never looser
      then('🔴 exit code is 2 — a bad --at is the caller`s to fix', () => {
        // exit 1 reads as a malfunction worth a retry; a retry on a typo'd
        // timestamp loops forever (rule.require.exit-code-semantics)
        expect(res.cli.code).toEqual(2);
      });

      then('🔴 the error lands on stderr, named as a constraint', () => {
        // a hook shows stderr apart from stdout on a non-zero exit, and may hide
        // stdout outright (rule.forbid.stdout-on-exit-errors)
        expect(res.cli.stderr).toContain(
          '✋ ConstraintError: snapshot not found',
        );
      });

      then('the refusal renders whole', () => {
        // the fix line names the command that lists valid --at values; a snapshot
        // shows a reword or a dropped fix line in the pr diff
        expect(sanitizeReflectOutputForSnapshot(res.cli.stderr)).toMatchSnapshot();
      });
    });
  });
});
