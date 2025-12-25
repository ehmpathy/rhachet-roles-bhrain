import * as fs from 'fs/promises';
import * as path from 'path';
import { given, then, useBeforeAll, when } from 'test-fns';

import { setupSourceRepo, setupTargetDir } from './.test/setup';
import { stepReflect } from './reflect';

describe('stepReflect.casePriorRules', () => {
  // increase timeout for claude-code invocations (3 minutes)
  jest.setTimeout(180000);

  given('[case1] target with prior rules', () => {
    const scene = useBeforeAll(async () => {
      const { repoDir: sourceDir } =
        await setupSourceRepo('typescript-quality');
      const { targetDir } = await setupTargetDir();

      // add prior rule to target
      await fs.mkdir(path.join(targetDir, 'practices'), { recursive: true });
      await fs.writeFile(
        path.join(targetDir, 'practices/rule.require.tests.md'),
        '# existing rule\n\nall code must have tests',
        'utf-8',
      );

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
      then('considers prior rules in blend step', async () => {
        const manifestPath = path.join(scene.result.draft.dir, 'manifest.json');
        const manifestContent = await fs.readFile(manifestPath, 'utf-8');
        const manifest = JSON.parse(manifestContent);

        expect(manifest.pureRules.length).toBeGreaterThan(0);
      });

      then('has at least one operation', async () => {
        const totalOps =
          scene.result.results.created +
          scene.result.results.updated +
          scene.result.results.appended +
          scene.result.results.omitted;
        expect(totalOps).toBeGreaterThan(0);
      });
    });
  });
});
