import * as fs from 'fs';
import { ConstraintError } from 'helpful-errors';
import * as path from 'path';
import { genTempDir, getError, given, then, when } from 'test-fns';

import { getAllFilesFromGlobs } from './getAllFilesFromGlobs';

describe('getAllFilesFromGlobs', () => {
  given('[case1] a dir with briefs, a dotfile, and a node_modules file', () => {
    const tempDir = genTempDir({ slug: 'test-librarian-glob-files' });
    fs.mkdirSync(path.join(tempDir, 'briefs'), { recursive: true });
    fs.mkdirSync(path.join(tempDir, 'node_modules/dep'), { recursive: true });
    fs.writeFileSync(path.join(tempDir, 'briefs/b.md.min'), 'b');
    fs.writeFileSync(path.join(tempDir, 'briefs/a.md.min'), 'a');
    fs.writeFileSync(path.join(tempDir, 'briefs/.hidden.md.min'), 'h');
    fs.writeFileSync(path.join(tempDir, 'node_modules/dep/x.md.min'), 'x');

    when('[t0] globs that overlap are expanded', () => {
      then('the files are deduped and sorted, with dotfiles kept', async () => {
        const files = await getAllFilesFromGlobs({
          globs: [
            path.join(tempDir, 'briefs/*.md.min'),
            path.join(tempDir, 'briefs/a.md.min'),
            path.join(tempDir, '**/*.md.min'),
          ],
        });
        expect(files).toEqual([
          path.join(tempDir, 'briefs/.hidden.md.min'),
          path.join(tempDir, 'briefs/a.md.min'),
          path.join(tempDir, 'briefs/b.md.min'),
        ]);
      });

      then('node_modules is never walked', async () => {
        const files = await getAllFilesFromGlobs({
          globs: [path.join(tempDir, '**/*.md.min')],
        });
        expect(files.some((file) => file.includes('node_modules'))).toEqual(
          false,
        );
      });
    });

    when('[t1] a glob names no file', () => {
      then('it throws a ConstraintError that names the globs', async () => {
        const error = await getError(
          getAllFilesFromGlobs({ globs: [path.join(tempDir, 'absent/*.md')] }),
        );
        expect(error).toBeInstanceOf(ConstraintError);
        expect(error.message).toContain('no file matched the --glob set');
        expect(error.message).toContain('absent/*.md');
      });
    });
  });
});
