import * as fs from 'fs/promises';
import * as path from 'path';
import { given, then, useBeforeAll, when } from 'test-fns';

import {
  DEFAULT_TEST_BRAIN,
  genTestBrainContext,
} from '@src/.test/genTestBrainContext';

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

describe('stepReflect.caseTypescriptQuality', () => {
  // increase timeout for claude-code invocations (3 minutes per attempt)
  jest.setTimeout(180000 * REPEAT_CONFIG.attempts);

  const brainScene = useBeforeAll(async () => ({
    brain: genTestBrainContext({ brain: DEFAULT_TEST_BRAIN }),
  }));

  given('[case1] typescript-quality feedback with valid target', () => {
    const scene = useBeforeAll(async () => {
      const { repoDir: sourceDir } =
        await setupSourceRepo('typescript-quality');
      const { targetDir } = await setupTargetDir();

      // run stepReflect once, share result across all then blocks
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

    when('[t0] stepReflect completes', () => {
      then('creates draft directory structure', async () => {
        expect(scene.result.draft.dir).toContain('.draft/v');
        expect(scene.result.draft.pureDir).toContain('/pure');
        expect(scene.result.draft.syncDir).toContain('/sync');
      });

      then('proposes rules from feedback', async () => {
        const pureFiles = await fs.readdir(scene.result.draft.pureDir);
        expect(pureFiles.length).toBeGreaterThan(0);
        expect(pureFiles.some((f) => f.startsWith('rule.'))).toBe(true);
      });

      then('creates manifest.json in draft directory', async () => {
        const manifestPath = path.join(scene.result.draft.dir, 'manifest.json');
        const manifestContent = await fs.readFile(manifestPath, 'utf-8');
        const manifest = JSON.parse(manifestContent);

        expect(manifest.timestamp).toBeDefined();
        expect(manifest.pureRules).toBeDefined();
        expect(Array.isArray(manifest.pureRules)).toBe(true);
      });

      then('returns metrics with expected values', async () => {
        // expected metrics are computed from prompt token estimates
        expect(scene.result.metrics.expected.tokens).toBeGreaterThan(0);
        expect(scene.result.metrics.expected.cost).toBeGreaterThan(0);
      });

      then('returns metrics with realized structure', async () => {
        // note: brain.choice.ask() does not return usage metrics
        // so realized tokens/cost are 0; we verify structure exists
        expect(scene.result.metrics.realized.total.tokens).toBeDefined();
        expect(scene.result.metrics.realized.total.cost).toBeDefined();
      });

      then('returns results with operation counts', async () => {
        const totalOps =
          scene.result.results.created +
          scene.result.results.updated +
          scene.result.results.appended +
          scene.result.results.omitted;
        expect(totalOps).toBeGreaterThan(0);
      });

      then('files count matches feedback files', async () => {
        expect(scene.result.metrics.files.feedbackCount).toBe(3);
      });
    });
  });
});
