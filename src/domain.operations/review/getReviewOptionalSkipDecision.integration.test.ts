import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { given, then, useBeforeAll, when } from 'test-fns';

import { getReviewOptionalSkipDecision } from './getReviewOptionalSkipDecision';

/**
 * .what = boundary coverage for the shared --optional skip-decision transformer
 * .why = this is the single source of the skip TRIGGER used by both review.ts (pre-brain) and
 *        stepReview (defense-in-depth); it walks the rules glob, so it is integration-grade.
 *        it must skip only when the rules supply is optional AND its glob matches zero files.
 */
describe('getReviewOptionalSkipDecision — skip trigger boundaries', () => {
  const scene = useBeforeAll(async () => {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'skip-decision-'));
    const rulesDir = path.join(tmpDir, 'rules');
    await fs.mkdir(rulesDir, { recursive: true });
    await fs.writeFile(path.join(rulesDir, 'rule.one.md'), '# rule one\n');
    return { tmpDir };
  });

  afterAll(async () => {
    await fs.rm(scene.tmpDir, { recursive: true, force: true });
  });

  given('[case1] rules is optional and its glob matches zero files', () => {
    when('[t0] the decision is computed', () => {
      const res = useBeforeAll(async () => ({
        decision: await getReviewOptionalSkipDecision({
          rules: 'rules/DOES_NOT_EXIST/*.md',
          optional: ['rules'],
          cwd: scene.tmpDir,
        }),
      }));

      then('it decides to skip', () => {
        expect(res.decision.skip).toBe(true);
      });

      then('it returns the normalized rule globs', () => {
        expect(res.decision.ruleGlobs).toEqual(['rules/DOES_NOT_EXIST/*.md']);
      });
    });
  });

  given('[case2] rules is optional but its glob DOES match files', () => {
    when('[t0] the decision is computed', () => {
      const res = useBeforeAll(async () => ({
        decision: await getReviewOptionalSkipDecision({
          rules: 'rules/*.md',
          optional: ['rules'],
          cwd: scene.tmpDir,
        }),
      }));

      then('it does NOT skip — a real review must run', () => {
        expect(res.decision.skip).toBe(false);
      });
    });
  });

  given('[case3] the glob is empty but rules is NOT flagged optional', () => {
    when('[t0] the decision is computed', () => {
      const res = useBeforeAll(async () => ({
        decision: await getReviewOptionalSkipDecision({
          rules: 'rules/DOES_NOT_EXIST/*.md',
          optional: undefined,
          cwd: scene.tmpDir,
        }),
      }));

      then('it does NOT skip — strict default fails loud downstream', () => {
        expect(res.decision.skip).toBe(false);
      });
    });
  });
});
