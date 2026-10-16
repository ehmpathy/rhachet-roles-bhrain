import * as fs from 'fs';
import * as path from 'path';
import { genTempDir, given, then, when } from 'test-fns';

import { getOneArtifactContentForDisplay } from './getOneArtifactContentForDisplay';

describe('getOneArtifactContentForDisplay', () => {
  given('[case1] an artifact on disk', () => {
    const dir = genTempDir({ slug: 'artifact-content-for-display' });
    const artifactPath = path.join(dir, 'given.by_peer.repo-rules.md');
    fs.writeFileSync(artifactPath, '2 blockers\n0 nitpicks\n');

    when('[t0] it is read', () => {
      then('it returns the raw text verbatim', async () => {
        const content = await getOneArtifactContentForDisplay({
          path: artifactPath,
        });
        expect(content).toEqual('2 blockers\n0 nitpicks\n');
      });
    });
  });

  given('[case2] a path whose artifact is absent', () => {
    const dir = genTempDir({ slug: 'artifact-content-for-display-absent' });

    when('[t0] it is read', () => {
      then('it returns null — the display falls back', async () => {
        const content = await getOneArtifactContentForDisplay({
          path: path.join(dir, 'absent.md'),
        });
        expect(content).toBeNull();
      });
    });
  });

  given('[case3] a directory where the artifact was expected', () => {
    const dir = genTempDir({ slug: 'artifact-content-for-display-dir' });
    const dirPath = path.join(dir, 'given.by_peer.repo-rules.md');
    fs.mkdirSync(dirPath);

    when('[t0] it is read', () => {
      then(
        'it returns null — an unreadable artifact is a display fallback too',
        async () => {
          const content = await getOneArtifactContentForDisplay({
            path: dirPath,
          });
          expect(content).toBeNull();
        },
      );
    });
  });
});
