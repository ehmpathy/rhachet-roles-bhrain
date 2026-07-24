import * as fs from 'fs/promises';
import * as path from 'path';
import { genTempDir, getError, given, then, when } from 'test-fns';

import { getSweepProgress } from './getSweepProgress';

describe('getSweepProgress.integration', () => {
  given('[case1] the sentinel is absent', () => {
    const tempDir = genTempDir({ slug: 'test-getSweepProgress-absent' });

    when('[t0] the progress file does not exist', () => {
      then(
        'returns null mtime + null content (stale by isSweepStale)',
        async () => {
          const state = await getSweepProgress({
            path: path.join(tempDir, 'progress.md'),
          });
          expect(state.mtime).toBeNull();
          expect(state.content).toBeNull();
        },
      );
    });
  });

  given('[case2] the sentinel exists', () => {
    const tempDir = genTempDir({ slug: 'test-getSweepProgress-present' });

    when('[t0] the progress file was just written', () => {
      then('returns its mtime + its content', async () => {
        const progressPath = path.join(tempDir, 'progress.md');
        const body =
          '## round\n\nno new terms this round — all names decomposed.';
        await fs.writeFile(progressPath, body, 'utf-8');

        const state = await getSweepProgress({ path: progressPath });

        // the content is returned verbatim, so isProgressArticulated can judge it
        expect(state.content).toEqual(body);
        // a real mtime is returned (not the absent-sentinel null)
        expect(state.mtime).not.toBeNull();
        // and it behaves like a date just written — within the last minute
        const ageMs = Date.now() - (state.mtime as Date).getTime();
        expect(ageMs).toBeLessThan(60 * 1000);
        expect(ageMs).toBeGreaterThanOrEqual(0);
      });
    });
  });

  given('[case3] a non-ENOENT fault (a file where a dir is expected)', () => {
    const tempDir = genTempDir({ slug: 'test-getSweepProgress-fault' });

    when('[t0] a parent path component is a file, not a dir (ENOTDIR)', () => {
      then('it fails loud with the path (not a bare rethrow)', async () => {
        // a plain file, then a read of a "child" under it → ENOTDIR, a real fault
        // that must NOT read as absent (null); it fails loud per failloud
        const filePath = path.join(tempDir, 'not-a-dir');
        await fs.writeFile(filePath, 'i am a file', 'utf-8');
        const faultPath = path.join(filePath, 'progress.md');

        const error = await getError(getSweepProgress({ path: faultPath }));

        // the fault surfaces (not swallowed to null) and names the sentinel path
        expect(error).toBeDefined();
        expect(error.message).toContain('sweep progress sentinel');
        expect(error.message).toContain(faultPath);
      });
    });
  });
});
