import * as fs from 'fs';
import { BadRequestError, getError } from 'helpful-errors';
import * as path from 'path';
import { genTempDir, given, then, useBeforeAll, when } from 'test-fns';

import { ReviewRunArtifactError } from '@src/domain.operations/review/ReviewRunArtifactError';

import { isRunArtifactPresent } from './isRunArtifactPresent';

describe('isRunArtifactPresent', () => {
  given('[case1] a run dir with its prompt artifact', () => {
    const scene = useBeforeAll(async () => {
      const dir = genTempDir({ slug: 'run-artifact-present' });
      fs.writeFileSync(path.join(dir, 'input.prompt.md'), 'the prompt');
      return { dir };
    });

    when('[t0] the artifact is asked for', () => {
      then('it is present', async () => {
        expect(
          await isRunArtifactPresent({
            at: path.join(scene.dir, 'input.prompt.md'),
          }),
        ).toBe(true);
      });
    });

    when('[t1] an artifact the run never wrote is asked for', () => {
      then('it is absent — a fact, never a fault', async () => {
        expect(
          await isRunArtifactPresent({
            at: path.join(scene.dir, 'metrics.realized.json'),
          }),
        ).toBe(false);
      });
    });
  });

  given('[case2] a run dir the reader has no permission to search', () => {
    const scene = useBeforeAll(async () => {
      // root reads a mode-000 dir, so no denial occurs — refuse by name
      if (process.getuid?.() === 0)
        throw new BadRequestError(
          'case2 needs a non-root user — root reads a mode-000 dir, so no denial occurs',
          { uid: 0, hint: 'run the integration suite as a non-root user' },
        );

      const dir = genTempDir({ slug: 'run-artifact-denied' });
      const run = path.join(dir, 'run');
      fs.mkdirSync(run);
      fs.writeFileSync(path.join(run, 'input.prompt.md'), 'the prompt');
      fs.chmodSync(run, 0o000);
      const error = await getError(
        isRunArtifactPresent({ at: path.join(run, 'input.prompt.md') }),
      );
      fs.chmodSync(run, 0o755);
      return { error };
    });

    when('[t0] the artifact is asked for', () => {
      then(
        '🔴 the fault is an ARTIFACT defect, so the meter isolates it to one row',
        () => {
          expect(scene.error).toBeInstanceOf(ReviewRunArtifactError);
          expect(scene.error.message).toContain(
            'could not tell whether a run artifact is there',
          );
        },
      );
    });
  });

  /**
   * a fault that belongs to no artifact must not take the artifact wrap. the meter
   * isolates a `ReviewRunArtifactError` to one `unknown` row, so a wrap of a caller
   * defect hides it as one quiet row rather than fail the scan loud
   * (rule.forbid.failhide). a path with a nul byte is a real fs rejection
   * (`ERR_INVALID_ARG_VALUE`) that no file on disk can cause
   */
  given('[case3] a path that no fs call could ever accept', () => {
    const scene = useBeforeAll(async () => {
      const error = await getError(
        isRunArtifactPresent({ at: 'input.prompt\u0000.md' }),
      );
      return { error };
    });

    when('[t0] the artifact is asked for', () => {
      then(
        '🔴 the defect surfaces as itself, never as an artifact fault',
        () => {
          expect(scene.error).not.toBeInstanceOf(ReviewRunArtifactError);
          expect(Reflect.get(scene.error, 'code')).toEqual(
            'ERR_INVALID_ARG_VALUE',
          );
        },
      );
    });
  });
});
