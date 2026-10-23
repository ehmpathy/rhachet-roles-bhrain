import * as fs from 'fs';
import * as path from 'path';
import { genTempDir, getError, given, then, when } from 'test-fns';

import { getOneReviewArtifactContent } from './getOneReviewArtifactContent';

describe('getOneReviewArtifactContent', () => {
  given('[case1] an artifact on disk', () => {
    const dir = genTempDir({ slug: 'review-artifact-content' });
    const artifactPath = path.join(dir, 'given.by_peer.repo-rules.md');
    fs.writeFileSync(artifactPath, '0 blockers\n0 nitpicks\n');

    when('[t0] it is read', () => {
      then('it returns the raw text verbatim', async () => {
        const content = await getOneReviewArtifactContent({
          path: artifactPath,
        });
        expect(content).toEqual('0 blockers\n0 nitpicks\n');
      });
    });
  });

  given('[case2] a path whose file vanished since enumeration', () => {
    const dir = genTempDir({ slug: 'review-artifact-content-absent' });

    when('[t0] it is read', () => {
      then(
        'it returns null — a race delete is a miss, never a fault',
        async () => {
          const content = await getOneReviewArtifactContent({
            path: path.join(dir, 'absent.md'),
          });
          expect(content).toBeNull();
        },
      );
    });
  });

  given('[case3] a directory where the artifact was expected', () => {
    const dir = genTempDir({ slug: 'review-artifact-content-dir' });
    const dirPath = path.join(dir, 'given.by_peer.repo-rules.md');
    fs.mkdirSync(dirPath);

    when('[t0] it is read', () => {
      then('the fault rethrows — only an absence reads as null', async () => {
        const error = await getError(
          getOneReviewArtifactContent({ path: dirPath }),
        );
        // node fs errors come from another realm, so the class is not jest's `Error`;
        // the code in the message is what proves the read was attempted and refused
        expect(error.message).toContain('EISDIR');
      });
    });
  });
});
