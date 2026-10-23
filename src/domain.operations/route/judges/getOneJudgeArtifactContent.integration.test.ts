import * as fs from 'fs';
import * as path from 'path';
import { genTempDir, getError, given, then, when } from 'test-fns';

import { getOneJudgeArtifactContent } from './getOneJudgeArtifactContent';

describe('getOneJudgeArtifactContent', () => {
  given('[case1] a judge artifact on disk', () => {
    const dir = genTempDir({ slug: 'judge-artifact-content' });
    const artifactPath = path.join(
      dir,
      '1.vision.guard.judge.i1p1.abc.def.j1.md',
    );
    fs.writeFileSync(artifactPath, 'passed: true\n');

    when('[t0] it is read', () => {
      then('it returns the raw text verbatim', async () => {
        const content = await getOneJudgeArtifactContent({
          path: artifactPath,
        });
        expect(content).toEqual('passed: true\n');
      });
    });
  });

  given('[case2] a path whose file vanished since enumeration', () => {
    const dir = genTempDir({ slug: 'judge-artifact-content-absent' });

    when('[t0] it is read', () => {
      then(
        'it returns null — a race delete is a cache miss, never a fault',
        async () => {
          const content = await getOneJudgeArtifactContent({
            path: path.join(dir, 'absent.md'),
          });
          expect(content).toBeNull();
        },
      );
    });
  });

  given('[case3] a directory where the artifact was expected', () => {
    const dir = genTempDir({ slug: 'judge-artifact-content-dir' });
    const dirPath = path.join(dir, '1.vision.guard.judge.i1p1.abc.def.j1.md');
    fs.mkdirSync(dirPath);

    when('[t0] it is read', () => {
      then('the fault rethrows — only an absence reads as null', async () => {
        const error = await getError(
          getOneJudgeArtifactContent({ path: dirPath }),
        );
        // node fs errors come from another realm, so the class is not jest's `Error`;
        // the code in the message proves the read was attempted and refused
        expect(error.message).toContain('EISDIR');
      });
    });
  });
});
