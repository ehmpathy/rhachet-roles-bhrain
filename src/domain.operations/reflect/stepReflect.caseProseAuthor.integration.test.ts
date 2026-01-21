import * as fs from 'fs/promises';
import { given, then, useBeforeAll, when } from 'test-fns';

import { setupSourceRepo, setupTargetDir } from './.test/setup';
import { stepReflect } from './stepReflect';

describe('stepReflect.caseProseAuthor', () => {
  // increase timeout for brain invocations (3 minutes)
  jest.setTimeout(180000);

  given('[case1] prose-author feedback with valid target', () => {
    const scene = useBeforeAll(async () => {
      const { repoDir: sourceDir } = await setupSourceRepo('prose-author');
      const { targetDir } = await setupTargetDir();

      const result = await stepReflect({
        source: sourceDir,
        target: targetDir,
        mode: 'push',
      });

      return { sourceDir, targetDir, result };
    });
    afterAll(async () => {
      await fs.rm(scene.sourceDir, { recursive: true, force: true });
      await fs.rm(scene.targetDir, { recursive: true, force: true });
    });

    when('[t0] stepReflect completes', () => {
      then('proposes rules from prose feedback', async () => {
        const pureFiles = await fs.readdir(scene.result.draft.pureDir);
        expect(pureFiles.length).toBeGreaterThan(0);
      });

      then('files count matches feedback files', async () => {
        expect(scene.result.metrics.files.feedbackCount).toBe(2);
      });
    });
  });
});
