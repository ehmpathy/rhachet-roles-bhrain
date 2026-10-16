import * as fs from 'fs';
import * as path from 'path';
import { genTempDir, getError, given, then, when } from 'test-fns';

import { getOneJudgeArtifactContent } from '@src/domain.operations/route/judges/getOneJudgeArtifactContent';

import { asGuardArtifactIteration } from '../artifact/asGuardArtifactIteration';
import { asExitCodeClass } from '../asExitCodeClass';
import { getOneStoneGuardJudgeVerdictFromFile } from './getOneStoneGuardJudgeVerdictFromFile';

describe('getOneStoneGuardJudgeVerdictFromFile', () => {
  given(
    '[case1] a judge file whose name carries an iteration, since vanished',
    () => {
      const dir = genTempDir({ slug: 'judge-verdict-absent' });

      when('[t0] its verdict is read', () => {
        then(
          'it returns null — a race delete is no verdict, never a fault',
          async () => {
            const verdict = await getOneStoneGuardJudgeVerdictFromFile({
              filePath: path.join(
                dir,
                '1.vision.guard.judge.i3p1.abc.def.j1.md',
              ),
            });
            expect(verdict).toBeNull();
          },
        );
      });
    },
  );

  given('[case2] a directory where the judge file was expected', () => {
    const dir = genTempDir({ slug: 'judge-verdict-dir' });
    const dirPath = path.join(dir, '1.vision.guard.judge.i3p1.abc.def.j1.md');
    fs.mkdirSync(dirPath);

    when('[t0] its verdict is read', () => {
      then('the fault rethrows — only an absence reads as null', async () => {
        const error = await getError(
          getOneStoneGuardJudgeVerdictFromFile({ filePath: dirPath }),
        );
        // node fs errors come from another realm; the code in the message proves the refusal
        expect(error.message).toContain('EISDIR');
      });
    });
  });

  given('[case3] a judge file present on disk, with a recorded exit', () => {
    const dir = genTempDir({ slug: 'judge-verdict-present' });
    const filePath = path.join(dir, '1.vision.guard.judge.i3p1.abc.def.j1.md');
    fs.writeFileSync(filePath, '# judge\n\nexit code: 2\n');

    when('[t0] its verdict is read', () => {
      then('it reads the iteration and classifies the exit', async () => {
        const verdict = await getOneStoneGuardJudgeVerdictFromFile({
          filePath,
        });
        expect(verdict).toEqual({
          iteration: asGuardArtifactIteration({
            filename: path.basename(filePath),
          }),
          exitClass: asExitCodeClass({ code: 2 }),
        });
      });

      // 🔴 i014 r007 blocker.1 — the read once fused its own `fs.readFile` + absence
      //    allowlist beside the named judge-artifact read. the read has one home, so a change to
      //    its absence rule reaches this verdict too
      then(
        'the absence and fault rules match the one judge-artifact read',
        async () => {
          const pathAbsent = path.join(dir, 'gone.guard.judge.i3p1.j1.md');
          const pathDir = path.join(dir, 'dir.guard.judge.i3p1.j1.md');
          fs.mkdirSync(pathDir, { recursive: true });

          // an absent file is null through both reads
          expect(await getOneJudgeArtifactContent({ path: pathAbsent })).toBe(
            null,
          );
          expect(
            await getOneStoneGuardJudgeVerdictFromFile({
              filePath: pathAbsent,
            }),
          ).toBe(null);

          // a fault rethrows through both reads, with the same code
          const errorShared = await getError(
            getOneJudgeArtifactContent({ path: pathDir }),
          );
          const errorVerdict = await getError(
            getOneStoneGuardJudgeVerdictFromFile({ filePath: pathDir }),
          );
          expect(errorVerdict.message).toEqual(errorShared.message);
        },
      );
    });
  });
});
