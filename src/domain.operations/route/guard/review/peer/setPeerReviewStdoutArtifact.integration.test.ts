import * as fs from 'fs';
import * as path from 'path';
import { genTempDir, given, then, when } from 'test-fns';

import { setPeerReviewStdoutArtifact } from './setPeerReviewStdoutArtifact';

describe('setPeerReviewStdoutArtifact', () => {
  given('[case1] a peer reviews dir with no given yet', () => {
    const dir = genTempDir({ slug: 'set-peer-review-stdout' });
    const target = path.join(dir, '1.vision._.given.by_peer.arch.md');

    when('[t0] the artifact is written', () => {
      then('it returns the path and the bytes read back verbatim', async () => {
        const result = await setPeerReviewStdoutArtifact({
          path: target,
          content: '0 blockers\n0 nitpicks\n',
        });
        expect(result.path).toEqual(target);
        expect(fs.readFileSync(target, 'utf-8')).toEqual(
          '0 blockers\n0 nitpicks\n',
        );
      });
    });
  });

  given('[case2] a given from a prior run of the same lane', () => {
    const dir = genTempDir({ slug: 'set-peer-review-stdout-rerun' });
    const target = path.join(dir, '1.vision._.given.by_peer.arch.md');
    fs.writeFileSync(target, '3 blockers\n1 nitpick\n└─ tallied\n');

    when('[t0] the lane reruns and writes again', () => {
      then(
        'the file is replaced wholesale — no footer from the prior run stacks',
        async () => {
          await setPeerReviewStdoutArtifact({
            path: target,
            content: '0 blockers\n0 nitpicks\n',
          });
          expect(fs.readFileSync(target, 'utf-8')).toEqual(
            '0 blockers\n0 nitpicks\n',
          );
        },
      );
    });
  });
});
