import * as fs from 'fs/promises';
import { given, then, useBeforeAll, useThen, when } from 'test-fns';

import {
  DEFAULT_TEST_BRAIN,
  genTestBrainContext,
} from '@src/.test/genTestBrainContext';
import { REPEATABLY_CONFIG } from '@src/.test/infra/repeatably';

import { setupSourceRepo, setupTargetDir } from './.test/setup';
import { stepReflect } from './stepReflect';

describe('stepReflect.caseUnclearFeedback', () => {
  // increase timeout for brain invocations (5 minutes)
  jest.setTimeout(300000);

  const brainScene = useBeforeAll(async () => ({
    brain: genTestBrainContext({ brain: DEFAULT_TEST_BRAIN }),
  }));

  given('[case1] unclear feedback with no extractable rules', () => {
    // track cleanup paths outside useThen to avoid deferred proxy issues
    // .note = deliberate mutation: the useThen block fills these paths once, so afterAll can
    //         remove the dirs it made; a useThen proxy cannot be read from afterAll
    const cleanup: { sourceDir?: string; targetDir?: string } = {};
    afterAll(async () => {
      if (cleanup.sourceDir)
        await fs.rm(cleanup.sourceDir, { recursive: true, force: true });
      if (cleanup.targetDir)
        await fs.rm(cleanup.targetDir, { recursive: true, force: true });
    });

    when.repeatably(REPEATABLY_CONFIG)('[t0] stepReflect completes', () => {
      // single brain call per attempt, result shared across assertions
      const scene = useThen('stepReflect succeeds', async () => {
        const { repoDir: sourceDir } =
          await setupSourceRepo('unclear-feedback');
        const { targetDir } = await setupTargetDir();

        // track for cleanup
        cleanup.sourceDir = sourceDir;
        cleanup.targetDir = targetDir;

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

      then('completes without error', async () => {
        expect(scene.result).toBeDefined();
      });

      then('produces zero or minimal rules', async () => {
        const pureFiles = await fs.readdir(scene.result.draft.pureDir);
        const ruleFiles = pureFiles.filter((f) => f.startsWith('rule.'));
        // unclear feedback should produce few or no rules
        expect(ruleFiles.length).toBeLessThanOrEqual(1);
      });

      then('has zero or minimal operations', async () => {
        const totalOps =
          scene.result.results.created +
          scene.result.results.updated +
          scene.result.results.appended;
        // unclear feedback should result in few or no sync operations
        expect(totalOps).toBeLessThanOrEqual(1);
      });
    });
  });
});
