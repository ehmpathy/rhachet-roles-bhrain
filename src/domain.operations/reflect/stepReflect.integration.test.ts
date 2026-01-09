import * as fs from 'fs/promises';
import { getError } from 'helpful-errors';
import * as os from 'os';
import * as path from 'path';
import { given, then, useBeforeAll, when } from 'test-fns';

import { ASSETS_TARGET, setupSourceRepo } from './.test/setup';
import { stepReflect } from './stepReflect';

describe('stepReflect', () => {
  given('[case1] source directory does not exist', () => {
    when('[t0] stepReflect is called', () => {
      then('throws BadRequestError about missing source', async () => {
        const error = await getError(
          stepReflect({
            source: '/nonexistent/source/directory',
            target: '/tmp/target',
            mode: 'soft',
          }),
        );

        expect(error).toBeDefined();
        expect(error.message).toContain('does not exist');
      });
    });
  });

  given('[case2] source has no feedback files', () => {
    when('[t0] stepReflect is called', () => {
      then('throws BadRequestError about no feedback files', async () => {
        const error = await getError(
          stepReflect({
            source: ASSETS_TARGET, // this dir has no feedback files
            target: '/tmp/target',
            mode: 'soft',
          }),
        );

        expect(error).toBeDefined();
        expect(error.message).toContain('no feedback files');
      });
    });
  });

  given('[case3] source is not a git repo', () => {
    const scene = useBeforeAll(async () => {
      // create temp dir with feedback file but no git
      const sourceDir = path.join(
        os.tmpdir(),
        `bhrain-reflect-nogit-${Date.now()}`,
      );
      await fs.mkdir(path.join(sourceDir, '.behavior/v2025_01_01.feature'), {
        recursive: true,
      });
      await fs.writeFile(
        path.join(
          sourceDir,
          '.behavior/v2025_01_01.feature/[feedback].v1.[given].by_human.md',
        ),
        '# test feedback',
        'utf-8',
      );

      const targetDir = path.join(
        os.tmpdir(),
        `bhrain-reflect-target-${Date.now()}`,
      );
      await fs.mkdir(targetDir, { recursive: true });

      return { sourceDir, targetDir };
    });
    afterAll(async () => {
      await fs.rm(scene.sourceDir, { recursive: true, force: true });
      await fs.rm(scene.targetDir, { recursive: true, force: true });
    });

    when('[t0] stepReflect is called', () => {
      then('throws BadRequestError about missing git remote', async () => {
        const error = await getError(
          stepReflect({
            source: scene.sourceDir,
            target: scene.targetDir,
            mode: 'soft',
          }),
        );

        expect(error).toBeDefined();
        expect(error.message).toContain('not a git repository');
      });
    });
  });

  given('[case4] target does not exist without force', () => {
    const scene = useBeforeAll(async () => {
      const { repoDir } = await setupSourceRepo('typescript-quality');
      return { sourceDir: repoDir };
    });
    afterAll(async () => {
      await fs.rm(scene.sourceDir, { recursive: true, force: true });
    });

    when('[t0] stepReflect is called', () => {
      then('throws BadRequestError about missing target', async () => {
        const error = await getError(
          stepReflect({
            source: scene.sourceDir,
            target: `/tmp/nonexistent-target-${Date.now()}`,
            mode: 'soft',
            force: false,
          }),
        );

        expect(error).toBeDefined();
        expect(error.message).toContain('does not exist');
      });
    });
  });
});
