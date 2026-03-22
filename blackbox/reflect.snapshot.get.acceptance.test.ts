import * as path from 'path';

import { given, then, useThen, when } from 'test-fns';

import {
  execAsync,
  genTempDirForReflector,
  invokeReflectSkill,
  sanitizeReflectOutputForSnapshot,
} from './.test/invokeReflectSkill';

const ASSETS_DIR = path.join(__dirname, '.test/assets/reflect-snapshot');

describe('reflect.snapshot get', () => {
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

      then('exit code is non-zero', () => {
        expect(res.cli.code).not.toEqual(0);
      });

      then('error mentions not found', () => {
        // error may be in stdout or stderr; check both
        const combined = `${res.cli.stdout} ${res.cli.stderr}`.toLowerCase();
        expect(combined).toMatch(/not found|snapshot|timestamp/);
      });
    });
  });
});
