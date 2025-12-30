import * as fs from 'fs/promises';
import { given, then, useBeforeAll, when } from 'test-fns';

import { setupSourceRepo, setupTargetDir } from './.test/setup';
import { stepReflect } from './reflect';

describe('stepReflect.caseUnclearFeedback', () => {
  // increase timeout for claude-code invocations (3 minutes)
  jest.setTimeout(180000);

  given('[case1] unclear feedback with no extractable rules', () => {
    const scene = useBeforeAll(async () => {
      const { repoDir: sourceDir } = await setupSourceRepo('unclear-feedback');
      const { targetDir } = await setupTargetDir();

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

    when('[t0] stepReflect completes', () => {
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
