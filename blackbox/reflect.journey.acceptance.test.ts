import * as fs from 'fs/promises';
import * as path from 'path';

import { given, then, useBeforeAll, useThen, when } from 'test-fns';

import {
  execAsync,
  genTempDirForReflector,
  invokeReflectSkill,
  sanitizeReflectOutputForSnapshot,
} from './.test/invokeReflectSkill';

const ASSETS_DIR = path.join(__dirname, '.test/assets/reflect-snapshot');

/**
 * .what = journey acceptance test for full reflect workflow
 * .why = exercises complete experience preservation workflow with mock claude project
 *
 * journey:
 *   [t0] before any changes
 *   [t1] create first savepoint
 *   [t2] create second savepoint (verify accumulation)
 *   [t3] list savepoints (verify count)
 *   [t4] annotate (label a defect)
 *   [t5] annotate again (label the fix)
 *   [t6] snapshot get (verify annotations count)
 *   [t7] snapshot capture (the fundamental purpose)
 *   [t8] snapshot get (verify captured snapshot)
 */
describe('reflect.journey.acceptance', () => {
  given('[journey] full reflect workflow', () => {
    const scene = useBeforeAll(async () => {
      // mock transcript content (JSONL format)
      const mockTranscript = [
        '{"type":"user","message":"help me fix this bug","timestamp":"2026-03-12T10:00:00.000Z"}',
        '{"type":"assistant","message":"let me investigate","timestamp":"2026-03-12T10:00:05.000Z"}',
        '{"type":"user","message":"thanks","timestamp":"2026-03-12T10:00:30.000Z"}',
      ].join('\n');

      const tempDir = genTempDirForReflector({
        slug: 'reflect-journey',
        clone: ASSETS_DIR,
        mockClaudeProject: {
          mainFile: 'abc123-def456.jsonl',
          mainContent: mockTranscript,
        },
      });

      // link reflector role
      await execAsync('npx rhachet roles link --role reflector', {
        cwd: tempDir,
      });

      // create staged and unstaged changes for savepoint
      await fs.writeFile(
        path.join(tempDir, 'src/staged.ts'),
        'export const staged = true;',
      );
      await execAsync('git add src/staged.ts', { cwd: tempDir });
      await fs.writeFile(
        path.join(tempDir, 'src/unstaged.ts'),
        'export const unstaged = true;',
      );

      return { tempDir };
    });

    when('[t0] before any changes', () => {
      then('tempDir is a git repo with staged and unstaged changes', async () => {
        const { tempDir } = scene;
        const statusResult = await execAsync('git status --porcelain', {
          cwd: tempDir,
        });
        expect(statusResult.stdout).toContain('A  src/staged.ts');
        expect(statusResult.stdout).toContain('?? src/unstaged.ts');
      });
    });

    when('[t1] first savepoint is created', () => {
      const result = useThen('savepoint is captured', async () => {
        const { tempDir } = scene;
        return invokeReflectSkill({
          skill: 'reflect.savepoint',
          subcommand: 'set',
          args: { mode: 'apply' },
          cwd: tempDir,
        });
      });

      then('exit code is 0', () => {
        expect(result.code).toEqual(0);
      });

      then('output shows savepoint captured', () => {
        expect(result.stdout).toContain('savepoint captured');
      });

      then('output shows staged.patch and unstaged.patch', () => {
        expect(result.stdout).toContain('staged.patch');
        expect(result.stdout).toContain('unstaged.patch');
      });

      then('stdout matches snapshot', () => {
        expect(
          sanitizeReflectOutputForSnapshot(result.stdout),
        ).toMatchSnapshot();
      });
    });

    when('[t2] second savepoint is created with new staged file', () => {
      const result = useThen('savepoint is captured', async () => {
        const { tempDir } = scene;

        // ensure distinct timestamp (1s+ for HHMMSS precision)
        await new Promise((done) => setTimeout(done, 1100));

        // add another staged file to change the hash
        await fs.writeFile(
          path.join(tempDir, 'src/second.ts'),
          'export const second = 2;',
        );
        await execAsync('git add src/second.ts', { cwd: tempDir });

        return invokeReflectSkill({
          skill: 'reflect.savepoint',
          subcommand: 'set',
          args: { mode: 'apply' },
          cwd: tempDir,
        });
      });

      then('exit code is 0', () => {
        expect(result.code).toEqual(0);
      });

      then('output shows savepoint captured', () => {
        expect(result.stdout).toContain('savepoint captured');
      });

      then('stdout matches snapshot', () => {
        expect(
          sanitizeReflectOutputForSnapshot(result.stdout),
        ).toMatchSnapshot();
      });
    });

    when('[t3] savepoints are listed', () => {
      const result = useThen('savepoint list is retrieved', async () => {
        const { tempDir } = scene;
        return invokeReflectSkill({
          skill: 'reflect.savepoint',
          subcommand: 'get',
          cwd: tempDir,
        });
      });

      then('exit code is 0', () => {
        expect(result.code).toEqual(0);
      });

      then('output shows savepoints = 2', () => {
        expect(result.stdout).toMatch(/savepoints\s*=\s*2/);
      });

      then('stdout matches snapshot', () => {
        expect(
          sanitizeReflectOutputForSnapshot(result.stdout),
        ).toMatchSnapshot();
      });
    });

    when('[t4] first annotation is created', () => {
      const result = useThen('annotation is created', async () => {
        const { tempDir } = scene;
        return invokeReflectSkill({
          skill: 'reflect.snapshot',
          subcommand: 'annotate',
          args: { _: 'detected defect: model hallucinated api endpoint' },
          cwd: tempDir,
        });
      });

      then('exit code is 0', () => {
        expect(result.code).toEqual(0);
      });

      then('output shows annotated', () => {
        expect(result.stdout).toContain('annotated');
      });

      then('stdout matches snapshot', () => {
        expect(
          sanitizeReflectOutputForSnapshot(result.stdout),
        ).toMatchSnapshot();
      });
    });

    when('[t5] second annotation is created', () => {
      const result = useThen('annotation is created', async () => {
        const { tempDir } = scene;

        // ensure distinct timestamp
        await new Promise((done) => setTimeout(done, 1100));

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

      then('output shows annotated', () => {
        expect(result.stdout).toContain('annotated');
      });

      then('stdout matches snapshot', () => {
        expect(
          sanitizeReflectOutputForSnapshot(result.stdout),
        ).toMatchSnapshot();
      });
    });

    when('[t6] snapshot get shows annotations', () => {
      const result = useThen('snapshot get is retrieved', async () => {
        const { tempDir } = scene;
        return invokeReflectSkill({
          skill: 'reflect.snapshot',
          subcommand: 'get',
          cwd: tempDir,
        });
      });

      then('exit code is 0', () => {
        expect(result.code).toEqual(0);
      });

      then('output shows annotations = 2', () => {
        expect(result.stdout).toMatch(/annotations\s*=\s*2/);
      });

      then('stdout matches snapshot', () => {
        expect(
          sanitizeReflectOutputForSnapshot(result.stdout),
        ).toMatchSnapshot();
      });
    });

    when('[t7] snapshot is captured', () => {
      const result = useThen('snapshot capture succeeds', async () => {
        const { tempDir } = scene;
        return invokeReflectSkill({
          skill: 'reflect.snapshot',
          subcommand: 'capture',
          cwd: tempDir,
        });
      });

      then('exit code is 0', () => {
        expect(result.code).toEqual(0);
      });

      then('output shows captured', () => {
        expect(result.stdout).toContain('captured');
      });

      then('output shows transcript stats', () => {
        expect(result.stdout).toContain('episodes');
        expect(result.stdout).toContain('mainFile');
      });

      then('output shows savepoints bundled', () => {
        expect(result.stdout).toContain('savepoints');
      });

      then('stdout matches snapshot', () => {
        expect(
          sanitizeReflectOutputForSnapshot(result.stdout),
        ).toMatchSnapshot();
      });
    });

    when('[t8] snapshot get shows captured snapshot', () => {
      const result = useThen('snapshot get is retrieved', async () => {
        const { tempDir } = scene;
        return invokeReflectSkill({
          skill: 'reflect.snapshot',
          subcommand: 'get',
          cwd: tempDir,
        });
      });

      then('exit code is 0', () => {
        expect(result.code).toEqual(0);
      });

      then('output shows snapshots = 1', () => {
        expect(result.stdout).toMatch(/snapshots\s*=\s*1/);
      });

      then('output still shows annotations = 2', () => {
        expect(result.stdout).toMatch(/annotations\s*=\s*2/);
      });

      then('stdout matches snapshot', () => {
        expect(
          sanitizeReflectOutputForSnapshot(result.stdout),
        ).toMatchSnapshot();
      });
    });
  });
});
