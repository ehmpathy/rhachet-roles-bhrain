import * as fs from 'fs/promises';
import { BadRequestError, getError } from 'helpful-errors';
import * as os from 'os';
import * as path from 'path';
import { given, then, useBeforeAll, when } from 'test-fns';

import { getFsErrorCode } from '@src/utils/fs/getFsErrorCode';
import { getOneFileTextOrNull } from '@src/utils/fs/getOneFileTextOrNull';

/**
 * .what = integration tests for the shared "read text, null on absence" reader
 * .why = every artifact reader leans on it; clamped over real files in a real temp
 *        dir, no mocks (rule.forbid.unit.remote-boundaries)
 */
describe('getOneFileTextOrNull.integration', () => {
  const scene = useBeforeAll(async () => {
    const cwd = path.join(
      os.tmpdir(),
      `int-file-text-or-null-${Date.now()}-${process.pid}`,
    );
    await fs.mkdir(path.join(cwd, 'adir'), { recursive: true });
    await fs.writeFile(path.join(cwd, 'present.md'), 'hello\n');
    return { cwd };
  });

  afterAll(async () => {
    await fs.rm(scene.cwd, { recursive: true, force: true });
  });

  given('[case1] a file that is present', () => {
    when('[t0] it is read', () => {
      then('it returns the utf-8 text', async () => {
        const text = await getOneFileTextOrNull({
          path: path.join(scene.cwd, 'present.md'),
        });
        expect(text).toEqual('hello\n');
      });
    });
  });

  given('[case2] a path that does not exist (ENOENT)', () => {
    when('[t0] it is read', () => {
      then('it returns null', async () => {
        const text = await getOneFileTextOrNull({
          path: path.join(scene.cwd, 'absent.md'),
        });
        expect(text).toBeNull();
      });
    });
  });

  given('[case3] a path whose parent is a file (ENOTDIR)', () => {
    when('[t0] it is read', () => {
      then('it returns null, never a raw stack', async () => {
        const text = await getOneFileTextOrNull({
          path: path.join(scene.cwd, 'present.md', 'child.md'),
        });
        expect(text).toBeNull();
      });
    });
  });

  given('[case4] a directory at the path (EISDIR)', () => {
    when('[t0] it is read', () => {
      then('it rethrows the fault', async () => {
        const error = await getError(
          getOneFileTextOrNull({ path: path.join(scene.cwd, 'adir') }),
        );
        expect(getFsErrorCode(error)).toEqual('EISDIR');
      });
    });
  });

  given(
    '[case5] a present file under a parent it cannot traverse (EACCES)',
    () => {
      // 🔴 the denial a bare catch would read as "absent": the file exists, the parent's
      //    0o000 bars the read. the reader must rethrow it, never answer null
      const locked = useBeforeAll(async () => {
        const dir = path.join(scene.cwd, 'locked');
        await fs.mkdir(dir, { recursive: true });
        await fs.writeFile(path.join(dir, 'secret.md'), 'hidden\n');
        await fs.chmod(dir, 0o000);

        // fail fast where the runner bypasses file perms (root): the lock would not bite
        const bypassed = await fs.readdir(dir).then(
          () => true,
          () => false,
        );
        if (bypassed) {
          await fs.chmod(dir, 0o755);
          throw new BadRequestError('this runner reads a 0o000 dir', {
            hint: 'run the integration suite as a non-root user',
            uid: process.getuid?.() ?? null,
          });
        }
        return { dir };
      });

      // restore the lock before the tree is removed, so no 0o000 dir is left behind
      afterAll(async () => {
        await fs.chmod(locked.dir, 0o755);
      });

      when('[t0] it is read', () => {
        then('it rethrows the denial, never answers null', async () => {
          const error = await getError(
            getOneFileTextOrNull({ path: path.join(locked.dir, 'secret.md') }),
          );
          expect(getFsErrorCode(error)).toEqual('EACCES');
        });
      });
    },
  );
});
