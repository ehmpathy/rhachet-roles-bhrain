import * as fs from 'fs/promises';
import * as path from 'path';
import { genTempDir, given, then, useBeforeAll, when } from 'test-fns';

import { getAllTargetFilesExceptDirs } from './getAllTargetFilesExceptDirs';

describe('getAllTargetFilesExceptDirs', () => {
  given(
    '[case1] targets that mix files, a symlink to a dir, a dir, and a deleted path',
    () => {
      const scene = useBeforeAll(async () => {
        const cwd = genTempDir({ slug: 'targets-except-dirs' });
        await fs.mkdir(path.join(cwd, 'src'), { recursive: true });
        await fs.writeFile(path.join(cwd, 'src/a.ts'), 'export const a = 1;');
        await fs.mkdir(path.join(cwd, '.agent/brain/.claude'), {
          recursive: true,
        });
        await fs.symlink('.agent/brain/.claude', path.join(cwd, '.claude'));
        await fs.writeFile(path.join(cwd, 'src/target.md'), '# target');
        await fs.symlink('target.md', path.join(cwd, 'src/link.md'));
        return { cwd };
      });

      when('[t0] the targets are filtered', () => {
        then('the symlink to a directory is dropped', async () => {
          const files = await getAllTargetFilesExceptDirs({
            files: ['.claude', 'src/a.ts'],
            cwd: scene.cwd,
          });
          expect(files).toEqual(['src/a.ts']);
        });

        then('a plain directory is dropped', async () => {
          const files = await getAllTargetFilesExceptDirs({
            files: ['src', 'src/a.ts'],
            cwd: scene.cwd,
          });
          expect(files).toEqual(['src/a.ts']);
        });

        then(
          'a symlink to a file and an absent (deleted) path are kept',
          async () => {
            const files = await getAllTargetFilesExceptDirs({
              files: ['src/link.md', 'src/gone.ts'],
              cwd: scene.cwd,
            });
            expect(files).toEqual(['src/link.md', 'src/gone.ts']);
          },
        );
      });
    },
  );
});
