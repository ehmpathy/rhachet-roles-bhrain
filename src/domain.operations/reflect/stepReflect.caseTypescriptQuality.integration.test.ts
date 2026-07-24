import * as fs from 'fs/promises';
import * as path from 'path';
import { given, then, useBeforeAll, useThen, when } from 'test-fns';

import {
  DEFAULT_TEST_BRAIN,
  genTestBrainContext,
} from '@src/.test/genTestBrainContext';
import { REPEATABLY_CONFIG } from '@src/.test/infra/repeatably';

import { setupSourceRepo, setupTargetDir } from './.test/setup';
import { stepReflect } from './stepReflect';

describe('stepReflect.caseTypescriptQuality', () => {
  // increase timeout for claude-code invocations (3 minutes per attempt)
  jest.setTimeout(180000 * REPEATABLY_CONFIG.attempts);

  const brainScene = useBeforeAll(async () => ({
    brain: genTestBrainContext({ brain: DEFAULT_TEST_BRAIN }),
  }));

  given('[case1] typescript-quality feedback with valid target', () => {
    // track cleanup paths outside useThen to avoid deferred proxy issues
    const cleanup: { sourceDir?: string; targetDir?: string } = {};
    afterAll(async () => {
      if (cleanup.sourceDir)
        await fs.rm(cleanup.sourceDir, { recursive: true, force: true });
      if (cleanup.targetDir)
        await fs.rm(cleanup.targetDir, { recursive: true, force: true });
    });

    when.repeatably(REPEATABLY_CONFIG)('[t0] stepReflect completes', () => {
      // single LLM invocation, result shared across assertions
      const scene = useThen('stepReflect succeeds', async () => {
        const { repoDir: sourceDir } =
          await setupSourceRepo('typescript-quality');
        const { targetDir } = await setupTargetDir();

        // track for cleanup
        cleanup.sourceDir = sourceDir;
        cleanup.targetDir = targetDir;

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
