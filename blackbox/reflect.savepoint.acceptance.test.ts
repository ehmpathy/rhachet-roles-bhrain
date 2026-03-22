import * as fs from 'fs/promises';
import * as path from 'path';

import { given, then, useThen, when } from 'test-fns';

import {
  execAsync,
  genTempDirForReflector,
  invokeReflectSkill,
  sanitizeReflectOutputForSnapshot,
} from './.test/invokeReflectSkill';

const ASSETS_DIR = path.join(__dirname, '.test/assets/reflect-snapshot');

describe('reflect.savepoint', () => {
  given('[case1] repo with staged and unstaged changes', () => {
    const tempDir = genTempDirForReflector({
      slug: 'reflect-savepoint-case1',
      clone: ASSETS_DIR,
    });

    // link reflector role
    beforeAll(async () => {
      await execAsync('npx rhachet roles link --role reflector', {
        cwd: tempDir,
      });
      // stage one file and leave another unstaged
      await fs.writeFile(
        path.join(tempDir, 'src/staged.ts'),
        'export const staged = true;',
      );
      await execAsync('git add src/staged.ts', { cwd: tempDir });
      await fs.writeFile(
        path.join(tempDir, 'src/unstaged.ts'),
        'export const unstaged = true;',
      );
    });

    when('[t0] reflect.savepoint set is invoked in plan mode', () => {
      const result = useThen('skill invocation succeeds', async () =>
        invokeReflectSkill({
          skill: 'reflect.savepoint',
          subcommand: 'set',
          cwd: tempDir,
        }),
      );

      then('exit code is 0', () => {
        expect(result.code).toEqual(0);
      });

      then('output contains owl header', () => {
        expect(result.stdout).toContain('know thyself');
      });

      then('output shows staged.patch info', () => {
        expect(result.stdout).toContain('staged.patch');
      });

      then('output shows unstaged.patch info', () => {
        expect(result.stdout).toContain('unstaged.patch');
      });

      then('output shows hash', () => {
        expect(result.stdout).toMatch(/hash\s*=\s*[a-f0-9]{7}/);
      });

      then('output shows artifacts section with planned paths', () => {
        expect(result.stdout).toContain('artifacts');
        expect(result.stdout).toMatch(/\.staged\.patch/);
        expect(result.stdout).toMatch(/\.unstaged\.patch/);
      });

      then('output matches snapshot', () => {
        expect(sanitizeReflectOutputForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });

    when('[t1] reflect.savepoint set is invoked with --mode apply', () => {
      const result = useThen('skill invocation completes', async () =>
        invokeReflectSkill({
          skill: 'reflect.savepoint',
          subcommand: 'set',
          args: { mode: 'apply' },
          cwd: tempDir,
        }),
      );

      then('exit code is 0', () => {
        expect(result.code).toEqual(0);
      });

      then('output shows savepoint captured', () => {
        expect(result.stdout).toContain('savepoint captured');
      });

      then('output shows staged and unstaged patches', () => {
        expect(result.stdout).toContain('staged.patch');
        expect(result.stdout).toContain('unstaged.patch');
      });

      then('output shows artifacts section with both file paths', () => {
        expect(result.stdout).toContain('artifacts');
        expect(result.stdout).toMatch(/\.staged\.patch/);
        expect(result.stdout).toMatch(/\.unstaged\.patch/);
      });

      then('output matches snapshot', () => {
        expect(
          sanitizeReflectOutputForSnapshot(result.stdout),
        ).toMatchSnapshot();
      });
    });

    when('[t2] reflect.savepoint get is invoked', () => {
      const result = useThen('skill invocation succeeds', async () =>
        invokeReflectSkill({
          skill: 'reflect.savepoint',
          subcommand: 'get',
          cwd: tempDir,
        }),
      );

      then('exit code is 0', () => {
        expect(result.code).toEqual(0);
      });

      then('output contains owl header', () => {
        expect(result.stdout).toContain('know thyself');
      });

      then('output lists savepoints', () => {
        expect(result.stdout).toContain('savepoints');
      });

      then('output matches snapshot', () => {
        expect(sanitizeReflectOutputForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });
  });
});
