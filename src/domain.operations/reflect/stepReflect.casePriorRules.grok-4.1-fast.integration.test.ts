import * as fs from 'fs/promises';
import * as path from 'path';
import { given, then, useBeforeAll, useThen, when } from 'test-fns';

import { genTestBrainContext } from '@src/.test/genTestBrainContext';
import type { ReviewerReflectManifest } from '@src/domain.objects/Reviewer/ReviewerReflectManifest';

import { setupSourceRepo, setupTargetDir } from './.test/setup';
import { stepReflect } from './stepReflect';

describe('stepReflect.casePriorRules.grok-4.1-fast', () => {
  // increase timeout for brain invocations (5 minutes)
  jest.setTimeout(300000);

  const brainScene = useBeforeAll(async () => ({
    brain: genTestBrainContext({ brain: 'xai/grok/4.1-fast-wout-reason' }),
  }));

  given('[case1] target with prior rule (explicit brain arg)', () => {
    when('[t0] stepReflect completes', () => {
      // single API call, result shared across assertions
      const scene = useThen('stepReflect succeeds', async () => {
        // setup source and target
        const { repoDir: sourceDir } =
          await setupSourceRepo('typescript-quality');
        const { targetDir } = await setupTargetDir();

        // add prior rule that matches feedback topic
        await fs.mkdir(path.join(targetDir, 'practices'), {
          recursive: true,
        });
        await fs.writeFile(
          path.join(targetDir, 'practices/rule.require.arrow-functions.md'),
          '# require arrow functions\n\nuse arrow functions instead of function keyword',
          'utf-8',
        );

        // run stepReflect with xai brain
        const result = await stepReflect(
          {
            source: sourceDir,
            target: targetDir,
            mode: 'push',
          },
          { brain: brainScene.brain },
        );

        return { sourceDir, targetDir, result };
      });

      afterAll(async () => {
        await fs.rm(scene.sourceDir, { recursive: true, force: true });
        await fs.rm(scene.targetDir, { recursive: true, force: true });
      });

      then('manifest includes operations for all pure rules', async () => {
        const manifestPath = path.join(scene.result.draft.dir, 'manifest.json');
        const manifestContent = await fs.readFile(manifestPath, 'utf-8');
        const manifest: ReviewerReflectManifest = JSON.parse(manifestContent);

        expect(manifest.pureRules.length).toBeGreaterThan(0);
      });

      then('produces at least one rule', async () => {
        const totalRules =
          scene.result.results.created +
          scene.result.results.updated +
          scene.result.results.appended;
        expect(totalRules).toBeGreaterThanOrEqual(1);
      });

      then('total operations equals pure rules count', async () => {
        const manifestPath = path.join(scene.result.draft.dir, 'manifest.json');
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
  });
});
