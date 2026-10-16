import * as path from 'path';

import { given, then, useThen, when } from 'test-fns';

import {
  execAsync,
  genTempDirForRhachet,
  invokeReviewSkill,
} from './.test/invokeReviewSkill';
import { asRedactedOutput } from './.test/asRedactedOutput';
import { DEFAULT_TEST_BRAIN_VIA_CLI } from '@src/.test/genTestBrainContext';

const ASSETS_DIR = path.join(__dirname, '.test/assets/codebase-mechanic');

describe('review.diffs-error.acceptance', () => {
  given('[case1] a --diffs range the skill does not know', () => {
    when('[t0] review skill invoked with --diffs since-yesterday', () => {
      const res = useThen('invoke review skill with a bad range', async () => {
        const tempDir = genTempDirForRhachet({
          slug: 'review-diffs-error-range',
          clone: ASSETS_DIR,
        });

        // link the reviewer role via rhachet
        await execAsync('npx rhachet roles link --role reviewer', {
          cwd: tempDir,
        });

        // the refusal fires before any brain call, so no credential is spent
        const cli = await invokeReviewSkill({
          rules: 'rules/rule.verify-refs-included.md',
          diffs: 'since-yesterday',
          output: path.join(tempDir, 'review-diffs-error.md'),
          focus: 'push',
          goal: 'representative',
          brain: DEFAULT_TEST_BRAIN_VIA_CLI,
          cwd: tempDir,
        });
        return { cli };
      });

      then('the cli exits as a constraint', () => {
        expect(res.cli.code).toEqual(2);
      });

      then('the refusal names the range it received and the ones it knows', () => {
        expect(res.cli.stderr).toContain(
          '✋ ConstraintError: --diffs range not recognized',
        );
        expect(res.cli.stderr).toContain('received: since-yesterday');
        expect(res.cli.stderr).toContain(
          'since-main | since-commit | since-staged',
        );
      });

      then('the refusal matches its snapshot', () => {
        expect(asRedactedOutput(res.cli.stderr)).toMatchSnapshot();
      });
    });
  });
});
