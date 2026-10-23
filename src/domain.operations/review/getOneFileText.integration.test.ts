import * as fs from 'fs';
import { getError } from 'helpful-errors';
import * as path from 'path';
import { genTempDir, given, then, useBeforeAll, when } from 'test-fns';

import { getOneFileText } from '@src/domain.operations/review/getOneFileText';
import { ReviewRunArtifactError } from '@src/domain.operations/review/ReviewRunArtifactError';

describe('getOneFileText', () => {
  given('[case1] a file that is there', () => {
    const scene = useBeforeAll(async () => {
      const dir = genTempDir({ slug: 'file-text-present' });
      fs.writeFileSync(path.join(dir, 'input.prompt.md'), 'the prompt');
      return { dir };
    });

    when('[t0] it is read', () => {
      then('its text comes back', async () => {
        expect(
          await getOneFileText({ at: path.join(scene.dir, 'input.prompt.md') }),
        ).toEqual('the prompt');
      });
    });

    when('[t1] a file never written is read', () => {
      then('it answers null — absence is a fact, never a fault', async () => {
        expect(
          await getOneFileText({ at: path.join(scene.dir, 'absent.json') }),
        ).toBeNull();
      });
    });
  });

  given('[case2] a dir sits where the file was expected', () => {
    const scene = useBeforeAll(async () => {
      const dir = genTempDir({ slug: 'file-text-isdir' });
      fs.mkdirSync(path.join(dir, 'input.prompt.md'));
      const error = await getError(
        getOneFileText({ at: path.join(dir, 'input.prompt.md') }),
      );
      return { error };
    });

    when('[t0] it is read', () => {
      then('the fault is an ARTIFACT defect, isolable to one row', () => {
        expect(scene.error).toBeInstanceOf(ReviewRunArtifactError);
        expect(scene.error.message).toContain('could not read a file');
      });
    });
  });

  /**
   * a nul byte in a path is a real fs rejection (`ERR_INVALID_ARG_VALUE`) that no
   * file on disk can cause — a caller defect. the meter isolates a
   * `ReviewRunArtifactError` to one quiet `unknown` row, so this must never take
   * that wrap (rule.forbid.failhide)
   */
  given('[case3] a path that no fs call could ever accept', () => {
    const scene = useBeforeAll(async () => {
      const error = await getError(
        getOneFileText({ at: 'input.prompt\u0000.md' }),
      );
      return { error };
    });

    when('[t0] it is read', () => {
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
