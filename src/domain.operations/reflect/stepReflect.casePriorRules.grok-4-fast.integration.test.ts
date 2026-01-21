import * as fs from 'fs/promises';
import * as path from 'path';
import { given, then, when } from 'test-fns';

import type { ReviewerReflectManifest } from '@src/domain.objects/Reviewer/ReviewerReflectManifest';

import { setupSourceRepo, setupTargetDir } from './.test/setup';
import { stepReflect } from './stepReflect';

/**
 * .what = repeatability config for flaky LLM tests
 * .why = local dev requires stricter (EVERY), CI allows lenient (SOME)
 */
const REPEAT_CONFIG = {
  attempts: process.env.CI ? 3 : 1,
  criteria: process.env.CI ? 'SOME' : 'EVERY',
} as const;

describe('stepReflect.casePriorRules.grok-4-fast', () => {
  // increase timeout for brain invocations (5 minutes per attempt)
  jest.setTimeout(300000 * REPEAT_CONFIG.attempts);

  given('[case1] target with prior rule (explicit brain arg)', () => {
    when('[t0] stepReflect completes', () => {
      then.repeatably(REPEAT_CONFIG)(
        'manifest includes operations for all pure rules',
        async () => {
          // setup source and target
          const { repoDir: sourceDir } =
            await setupSourceRepo('typescript-quality');
          const { targetDir } = await setupTargetDir();

          try {
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
            const result = await stepReflect({
              source: sourceDir,
              target: targetDir,
              mode: 'push',
              brain: 'xai/grok-4-fast',
            });

            // assert manifest has operations
            const manifestPath = path.join(result.draft.dir, 'manifest.json');
            const manifestContent = await fs.readFile(manifestPath, 'utf-8');
            const manifest: ReviewerReflectManifest =
              JSON.parse(manifestContent);

            expect(manifest.pureRules.length).toBeGreaterThan(0);
          } finally {
            // cleanup
            await fs.rm(sourceDir, { recursive: true, force: true });
            await fs.rm(targetDir, { recursive: true, force: true });
          }
        },
      );

      then.repeatably(REPEAT_CONFIG)('produces at least one rule', async () => {
        // setup source and target
        const { repoDir: sourceDir } =
          await setupSourceRepo('typescript-quality');
        const { targetDir } = await setupTargetDir();

        try {
          // add prior rule
          await fs.mkdir(path.join(targetDir, 'practices'), {
            recursive: true,
          });
          await fs.writeFile(
            path.join(targetDir, 'practices/rule.require.arrow-functions.md'),
            '# require arrow functions\n\nuse arrow functions instead of function keyword',
            'utf-8',
          );

          // run stepReflect
          const result = await stepReflect({
            source: sourceDir,
            target: targetDir,
            mode: 'push',
            brain: 'xai/grok-4-fast',
          });

          // assert at least one rule produced
          const totalRules =
            result.results.created +
            result.results.updated +
            result.results.appended;
          expect(totalRules).toBeGreaterThanOrEqual(1);
        } finally {
          await fs.rm(sourceDir, { recursive: true, force: true });
          await fs.rm(targetDir, { recursive: true, force: true });
        }
      });

      then.repeatably(REPEAT_CONFIG)(
        'total operations equals pure rules count',
        async () => {
          // setup source and target
          const { repoDir: sourceDir } =
            await setupSourceRepo('typescript-quality');
          const { targetDir } = await setupTargetDir();

          try {
            // add prior rule
            await fs.mkdir(path.join(targetDir, 'practices'), {
              recursive: true,
            });
            await fs.writeFile(
              path.join(targetDir, 'practices/rule.require.arrow-functions.md'),
              '# require arrow functions\n\nuse arrow functions instead of function keyword',
              'utf-8',
            );

            // run stepReflect
            const result = await stepReflect({
              source: sourceDir,
              target: targetDir,
              mode: 'push',
              brain: 'xai/grok-4-fast',
            });

            // assert counts match
            const manifestPath = path.join(result.draft.dir, 'manifest.json');
            const manifestContent = await fs.readFile(manifestPath, 'utf-8');
            const manifest: ReviewerReflectManifest =
              JSON.parse(manifestContent);

            const totalOps =
              result.results.created +
              result.results.updated +
              result.results.appended +
              result.results.omitted;
            expect(totalOps).toEqual(manifest.pureRules.length);
          } finally {
            await fs.rm(sourceDir, { recursive: true, force: true });
            await fs.rm(targetDir, { recursive: true, force: true });
          }
        },
      );
    });
  });
});
