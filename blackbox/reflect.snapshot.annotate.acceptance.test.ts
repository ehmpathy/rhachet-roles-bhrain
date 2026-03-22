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

describe('reflect.snapshot annotate', () => {
  given('[case1] valid annotation text', () => {
    const tempDir = genTempDirForReflector({
      slug: 'reflect-annotate-case1',
      clone: ASSETS_DIR,
    });

    beforeAll(async () => {
      await execAsync('npx rhachet roles link --role reflector', {
        cwd: tempDir,
      });
    });

    when('[t0] annotation is created', () => {
      const result = useThen('skill invocation succeeds', async () =>
        invokeReflectSkill({
          skill: 'reflect.snapshot',
          subcommand: 'annotate',
          args: { _: 'detected a defect: model hallucinated api endpoint' },
          cwd: tempDir,
        }),
      );

      then('exit code is 0', () => {
        expect(result.code).toEqual(0);
      });

      then('output contains owl header', () => {
        expect(result.stdout).toContain('know thyself');
      });

      then('output shows annotation path', () => {
        expect(result.stdout).toContain('annotation');
      });

      then('output matches snapshot', () => {
        expect(sanitizeReflectOutputForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });

    when('[t1] second annotation is created', () => {
      const result = useThen('skill invocation succeeds', async () => {
        // wait a bit for timestamp difference
        await new Promise((resolve) => setTimeout(resolve, 10));
        return invokeReflectSkill({
          skill: 'reflect.snapshot',
          subcommand: 'annotate',
          args: { _: 'corrected defect: added validation' },
          cwd: tempDir,
        });
      });

      then('exit code is 0', () => {
        expect(result.code).toEqual(0);
      });

      then('output shows annotated confirmation', () => {
        expect(result.stdout).toContain('annotated');
      });
    });
  });

  given('[case2] empty annotation text', () => {
    const tempDir = genTempDirForReflector({
      slug: 'reflect-annotate-case2',
      clone: ASSETS_DIR,
    });

    beforeAll(async () => {
      await execAsync('npx rhachet roles link --role reflector', {
        cwd: tempDir,
      });
    });

    when('[t0] annotation is attempted with empty text', () => {
      const result = useThen('skill invocation fails', async () =>
        invokeReflectSkill({
          skill: 'reflect.snapshot',
          subcommand: 'annotate',
          args: { _: '' },
          cwd: tempDir,
        }),
      );

      then('exit code is non-zero', () => {
        expect(result.code).not.toEqual(0);
      });

      then('error message mentions annotation text', () => {
        // error message appears in stdout (via console.log in CLI)
        const combined = `${result.stdout} ${result.stderr}`.toLowerCase();
        expect(combined).toMatch(/annotation|text|required/);
      });
    });
  });
});
