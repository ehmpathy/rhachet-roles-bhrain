import * as fs from 'fs/promises';
import * as path from 'path';
import { given, then, useBeforeAll, when } from 'test-fns';

import type { ReviewerReflectManifest } from '@src/domain.objects/Reviewer/ReviewerReflectManifest';

import { setupSourceRepo, setupTargetDir } from './.test/setup';
import { stepReflect } from './reflect';

describe('stepReflect.casePriorRules.rapid', () => {
  // increase timeout for claude-code invocations (3 minutes for haiku)
  jest.setTimeout(180000);

  given(
    '[case1] target with prior rule matching a feedback topic (haiku/rapid)',
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

        // use rapid mode (haiku) - SET_UPDATE is disabled, only SET_CREATE allowed
        // note: this may produce duplicates since haiku cannot merge with existing rules
        const result = await stepReflect({
          source: sourceDir,
          target: targetDir,
          mode: 'soft',
          rapid: true,
        });

        return { sourceDir, targetDir, result };
      });
      afterAll(async () => {
        await fs.rm(scene.sourceDir, { recursive: true, force: true });
        await fs.rm(scene.targetDir, { recursive: true, force: true });
      });

      when('[t0] stepReflect completes in rapid mode', () => {
        then('manifest includes operations for all pure rules', async () => {
          const manifestPath = path.join(
            scene.result.draft.dir,
            'manifest.json',
          );
          const manifestContent = await fs.readFile(manifestPath, 'utf-8');
          const manifest: ReviewerReflectManifest = JSON.parse(manifestContent);

          expect(manifest.pureRules.length).toBeGreaterThan(0);
        });

        then(
          'has zero SET_UPDATE operations (haiku cannot update)',
          async () => {
            // haiku/rapid mode does not support SET_UPDATE
            expect(scene.result.results.updated).toEqual(0);
          },
        );

        then('has only SET_CREATE operations for rules', async () => {
          // all rules should be created, not updated
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
