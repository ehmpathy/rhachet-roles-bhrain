import * as fs from 'fs/promises';
import * as path from 'path';
import { given, then, useBeforeAll, useThen, when } from 'test-fns';

import {
  DEFAULT_TEST_BRAIN,
  genTestBrainContext,
} from '@src/.test/genTestBrainContext';
import { REPEATABLY_CONFIG } from '@src/.test/infra/repeatably';
import type { ReviewerReflectManifest } from '@src/domain.objects/Reviewer/ReviewerReflectManifest';

import { setupSourceRepo, setupTargetDir } from './.test/setup';
import { stepReflect } from './stepReflect';

/**
 * .what = stepReflect against a target that already holds a rule on the feedback's topic
 * .why = the prior rule is what invites an UPDATE proposal, so this is the case that drives
 *        `executeManifestOperations`' merge path with a live model
 *
 * .note = the brain is live, so the case runs `when.repeatably` (rule.require.repeatable-for-llm-tests):
 *         EVERY locally, so an intermittent defect surfaces where it is cheap to diagnose; SOME in CI
 */
describe('stepReflect.casePriorRules.default', () => {
  // increase timeout for brain invocations (5 minutes)
  jest.setTimeout(300000);

  const brainScene = useBeforeAll(async () => ({
    brain: await genTestBrainContext({ brain: DEFAULT_TEST_BRAIN }),
  }));

  given(
    '[case1] target with prior rule (default brain = openrouter/deepseek)',
    () => {
      // track cleanup paths outside useThen to avoid deferred proxy issues
      // .note = deliberate mutation: the useThen block fills these paths once, so afterAll can
      //         remove the dirs it made; a useThen proxy cannot be read from afterAll
      const cleanup: { dirs: string[] } = { dirs: [] };
      afterAll(async () => {
        for (const dir of cleanup.dirs)
          await fs.rm(dir, { recursive: true, force: true });
      });

      when.repeatably(REPEATABLY_CONFIG)(
        '[t0] stepReflect completes with default brain',
        () => {
          // single API call per attempt, result shared across assertions
          const scene = useThen('stepReflect succeeds', async () => {
            const { repoDir: sourceDir } =
              await setupSourceRepo('typescript-quality');
            const { targetDir } = await setupTargetDir();
            cleanup.dirs.push(sourceDir, targetDir);

            // add prior rule that matches feedback topic (arrow functions mentioned in v1 and v3)
            await fs.mkdir(path.join(targetDir, 'practices'), {
              recursive: true,
            });
            await fs.writeFile(
              path.join(targetDir, 'practices/rule.require.arrow-functions.md'),
              '# require arrow functions\n\nuse arrow functions instead of function keyword',
              'utf-8',
            );

            // use the default brain (DEFAULT_TEST_BRAIN)
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

          then('manifest includes operations for all pure rules', async () => {
            const manifestPath = path.join(
              scene.result.draft.dir,
              'manifest.json',
            );
            const manifestContent = await fs.readFile(manifestPath, 'utf-8');
            const manifest: ReviewerReflectManifest =
              JSON.parse(manifestContent);

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
            const manifestPath = path.join(
              scene.result.draft.dir,
              'manifest.json',
            );
            const manifestContent = await fs.readFile(manifestPath, 'utf-8');
            const manifest: ReviewerReflectManifest =
              JSON.parse(manifestContent);

            const totalOps =
              scene.result.results.created +
              scene.result.results.updated +
              scene.result.results.appended +
              scene.result.results.omitted;
            expect(totalOps).toEqual(manifest.pureRules.length);
          });
        },
      );
    },
  );
});
