import * as fs from 'fs';
import * as path from 'path';
import { genTempDir, given, then, when } from 'test-fns';

import { setJudgeArtifact } from './setJudgeArtifact';

describe('setJudgeArtifact', () => {
  given('[case1] a .route dir with no judge artifact yet', () => {
    const dir = genTempDir({ slug: 'set-judge-artifact' });
    const target = path.join(dir, '1.vision.guard.judge.i1p1.abc.def.j1.md');

    when('[t0] the artifact is written', () => {
      then('it returns the path and the bytes read back verbatim', async () => {
        const result = await setJudgeArtifact({
          path: target,
          content: 'passed: true\n',
        });
        expect(result.path).toEqual(target);
        expect(fs.readFileSync(target, 'utf-8')).toEqual('passed: true\n');
      });
    });
  });

  given('[case2] a judge artifact from a prior run', () => {
    const dir = genTempDir({ slug: 'set-judge-artifact-rerun' });
    const target = path.join(dir, '1.vision.guard.judge.i1p1.abc.def.j1.md');
    fs.writeFileSync(target, 'passed: false\nreason: stale\n');

    when('[t0] the judge reruns and writes again', () => {
      then('the file is replaced wholesale', async () => {
        await setJudgeArtifact({ path: target, content: 'passed: true\n' });
        expect(fs.readFileSync(target, 'utf-8')).toEqual('passed: true\n');
      });
    });
  });
});
