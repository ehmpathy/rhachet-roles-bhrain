import * as fs from 'fs/promises';
import * as path from 'path';
import { given, then, useBeforeAll, when } from 'test-fns';

import type { ReviewerReflectManifest } from '@src/domain.objects/Reviewer/ReviewerReflectManifest';

import { setupSourceRepo, setupTargetDir } from './.test/setup';
import { stepReflect } from './reflect';

describe('stepReflect.casePriorRules.default', () => {
  // increase timeout for claude-code invocations (5 minutes for sonnet)
  jest.setTimeout(300000);

  given(
    '[case1] target with prior rule matching a feedback topic (sonnet)',
    () => {
      const scene = useBeforeAll(async () => {
        const { repoDir: sourceDir } =
          await setupSourceRepo('typescript-quality');
        const { targetDir } = await setupTargetDir();

        // add prior rule that matches feedback topic (arrow functions mentioned in v1 and v3)
        await fs.mkdir(path.join(targetDir, 'practices'), { recursive: true });
        await fs.writeFile(
          path.join(targetDir, 'practices/rule.require.arrow-functions.md'),
          '# require arrow functions\n\nuse arrow functions instead of function keyword',
          'utf-8',
        );

        // use sonnet (not rapid) for reliable SET_UPDATE handling
        const result = await stepReflect({
          source: sourceDir,
          target: targetDir,
          mode: 'soft',
          rapid: false,
        });

        return { sourceDir, targetDir, result };
      });
      afterAll(async () => {
        await fs.rm(scene.sourceDir, { recursive: true, force: true });
        await fs.rm(scene.targetDir, { recursive: true, force: true });
      });

      when('[t0] stepReflect completes', () => {
        then('manifest includes operations for all pure rules', async () => {
          const manifestPath = path.join(
            scene.result.draft.dir,
            'manifest.json',
          );
          const manifestContent = await fs.readFile(manifestPath, 'utf-8');
          const manifest: ReviewerReflectManifest = JSON.parse(manifestContent);

          expect(manifest.pureRules.length).toBeGreaterThan(0);
        });

        then('has at least one SET_UPDATE operation', async () => {
          expect(scene.result.results.updated).toBeGreaterThanOrEqual(1);
        });

        then('has at least one SET_CREATE operation', async () => {
          expect(scene.result.results.created).toBeGreaterThanOrEqual(1);
        });

        then('total operations equals pure rules count', async () => {
          const manifestPath = path.join(
            scene.result.draft.dir,
            'manifest.json',
          );
          const manifestContent = await fs.readFile(manifestPath, 'utf-8');
          const manifest: ReviewerReflectManifest = JSON.parse(manifestContent);

          const totalOps =
            scene.result.results.created +
            scene.result.results.updated +
            scene.result.results.appended +
            scene.result.results.omitted;
          expect(totalOps).toEqual(manifest.pureRules.length);
        });
      });
    },
  );
});
