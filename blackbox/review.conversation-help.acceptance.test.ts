import * as path from 'path';
import { given, then, useThen, when } from 'test-fns';

import { sanitizeTimeForSnapshot } from './.test/invokeRouteSkill';
import {
  execAsync,
  genTempDirForRhachet,
} from './.test/invokeReviewSkill';

const ASSETS_DIR = path.join(__dirname, '.test/assets/codebase-mechanic');

/**
 * .what = acceptance test for the discoverability of review --conversation
 * .why = --conversation is the driver-side half of the peer-review conversation
 *        feature; a reviewer author learns the flag from `review --help`, so the
 *        flag must appear there (rule.forbid.friction-hazards, r10-B2)
 */
describe('review.conversation-help.acceptance', () => {
  given('[case1] a linked reviewer role', () => {
    const scene = useThen('reviewer role links', async () => {
      const tempDir = genTempDirForRhachet({
        slug: 'review-conversation-help',
        clone: ASSETS_DIR,
      });
      await execAsync('npx rhachet roles link --role reviewer', {
        cwd: tempDir,
      });
      return { tempDir };
    });

    when('[t0] review --help renders', () => {
      const result = useThen('help renders', async () => {
        const skillPath = path.join(
          scene.tempDir,
          '.agent/repo=bhrain/role=reviewer/skills/review.sh',
        );
        try {
          return await execAsync(`bash "${skillPath}" --help`, {
            cwd: scene.tempDir,
            env: { ...process.env },
          });
        } catch (error) {
          const execError = error as { stdout?: string; stderr?: string };
          return {
            stdout: execError.stdout ?? '',
            stderr: execError.stderr ?? '',
          };
        }
      });

      then('the help lists the --conversation flag', () => {
        expect(result.stdout).toContain('--conversation');
      });

      then('the help explains it threads the prior dialogue', () => {
        expect(result.stdout).toContain('.given');
        expect(result.stdout).toContain('.taken');
      });

      then('[t0] help output matches snapshot', () => {
        // .why = the --help text is a user-visible contract surface; snapshot it so
        //        drift in the --conversation flag docs is visible in the pr diff
        //        (rule.require.snapshots + blueprint test-tree)
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });
  });
});
