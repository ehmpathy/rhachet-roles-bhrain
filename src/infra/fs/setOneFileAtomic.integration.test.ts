import * as fs from 'fs';
import * as path from 'path';
import { genTempDir, getError, given, then, when } from 'test-fns';

import { getFsErrorCode } from '@src/utils/fs/getFsErrorCode';

import { setOneFileAtomic } from './setOneFileAtomic';

describe('setOneFileAtomic', () => {
  given('[case1] a path whose parent dir is absent', () => {
    const cwd = genTempDir({ slug: 'set-one-file-atomic-fresh' });
    const filePath = path.join(cwd, '.route', 'state.json');

    when('[t0] a body is written with an mtime', () => {
      then('the body lands whole, at the stamped mtime', async () => {
        await setOneFileAtomic({
          path: filePath,
          content: '{ "a": 1 }\n',
          mtime: 1_700_000_000_000,
        });
        expect(fs.readFileSync(filePath, 'utf-8')).toEqual('{ "a": 1 }\n');
        expect(fs.statSync(filePath).mtimeMs).toEqual(1_700_000_000_000);
      });
    });
  });

  given('[case2] a file that already stands at the path', () => {
    const cwd = genTempDir({ slug: 'set-one-file-atomic-swap' });
    const filePath = path.join(cwd, 'state.json');
    fs.writeFileSync(filePath, 'prior\n');

    when('[t0] a new body is written with no mtime', () => {
      then(
        'it swaps in a new file, and leaves no draft beside it',
        async () => {
          const inodeBefore = fs.statSync(filePath).ino;
          await setOneFileAtomic({
            path: filePath,
            content: 'next\n',
            mtime: null,
          });
          expect(fs.readFileSync(filePath, 'utf-8')).toEqual('next\n');
          expect(fs.statSync(filePath).ino).not.toEqual(inodeBefore);
          expect(fs.readdirSync(cwd)).toEqual(['state.json']);
        },
      );
    });
  });

  given(
    '[case3] a non-empty directory stands at the path, so the swap fails',
    () => {
      const cwd = genTempDir({ slug: 'set-one-file-atomic-fault' });
      const filePath = path.join(cwd, 'state.json');
      fs.mkdirSync(path.join(filePath, 'child'), { recursive: true });

      when('[t0] a body is written', () => {
        then(
          '🔴 the rename fails loud, and the finally leaves no draft behind',
          async () => {
            const error = await getError(
              setOneFileAtomic({
                path: filePath,
                content: 'new\n',
                mtime: null,
              }),
            );
            // loud = the raw rename fault, its errno intact, and the path it hit named
            //        (rename(2) answers EISDIR when a file is swapped onto a directory)
            expect(getFsErrorCode(error)).toEqual('EISDIR');
            expect(error.message).toContain(filePath);
            expect(
              fs.readdirSync(cwd).filter((name) => name.includes('.draft.')),
            ).toEqual([]);
            expect(fs.statSync(filePath).isDirectory()).toEqual(true);
          },
        );
      });
    },
  );
});
