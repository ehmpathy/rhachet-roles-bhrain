import * as fs from 'fs/promises';
import { BadRequestError, getError } from 'helpful-errors';
import * as os from 'os';
import * as path from 'path';
import { given, then, useBeforeAll, when } from 'test-fns';

import { getFsErrorCode } from '@src/utils/fs/getFsErrorCode';

import { getAllTokensByTargetPath } from './getAllTokensByTargetPath';

/**
 * .what = integration tests for the brain-free price of each changed path's body
 * .why = the read sits under the entrance gate: a deleted path must price at 0, and a
 *        denied read must fail loud, never price at 0. clamped over a real temp dir, no mocks
 */
describe('getAllTokensByTargetPath.integration', () => {
  const scene = useBeforeAll(async () => {
    const cwd = path.join(
      os.tmpdir(),
      `int-tokens-by-target-path-${Date.now()}-${process.pid}`,
    );
    await fs.mkdir(path.join(cwd, 'src'), { recursive: true });
    await fs.writeFile(path.join(cwd, 'src/twelve.ts'), 'x'.repeat(12));
    await fs.writeFile(path.join(cwd, 'src/nine.ts'), 'y'.repeat(9));
    await fs.writeFile(path.join(cwd, 'src/empty.ts'), '');
    return { cwd };
  });

  afterAll(async () => {
    await fs.rm(scene.cwd, { recursive: true, force: true });
  });

  given('[case1] changed paths that all sit on disk', () => {
    when('[t0] they are priced', () => {
      then('each path reads its own body estimate', async () => {
        const prices = await getAllTokensByTargetPath({
          targets: ['src/twelve.ts', 'src/nine.ts', 'src/empty.ts'],
          cwd: scene.cwd,
        });
        expect([...prices.entries()]).toEqual([
          ['src/twelve.ts', 3],
          ['src/nine.ts', 3],
          ['src/empty.ts', 0],
        ]);
      });
    });
  });

  given('[case2] a mix of extant paths and a path the diff deleted', () => {
    when('[t0] they are priced', () => {
      // wrap the map: the useBeforeAll proxy does not forward Map methods (get, size)
      const priced = useBeforeAll(async () => ({
        prices: await getAllTokensByTargetPath({
          targets: ['src/twelve.ts', 'src/deleted.ts', 'src/nine.ts'],
          cwd: scene.cwd,
        }),
      }));

      then('🔴 the deleted path prices at 0, never a fault', () => {
        expect(priced.prices.get('src/deleted.ts')).toEqual(0);
      });

      then('the extant paths still read their own body estimate', () => {
        expect(priced.prices.get('src/twelve.ts')).toEqual(3);
        expect(priced.prices.get('src/nine.ts')).toEqual(3);
        expect(priced.prices.size).toEqual(3);
      });
    });
  });

  given(
    '[case3] a changed path under a parent it cannot traverse (EACCES)',
    () => {
      // 🔴 the denial a bare catch would price as "deleted": the file exists, the parent's
      //    0o000 bars the read. the price must fail loud, never read 0
      const locked = useBeforeAll(async () => {
        const dir = path.join(scene.cwd, 'locked');
        await fs.mkdir(dir, { recursive: true });
        await fs.writeFile(path.join(dir, 'secret.ts'), 'hidden\n');
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

      when('[t0] it is priced', () => {
        then('it rethrows the denial, never prices it at 0', async () => {
          const error = await getError(
            getAllTokensByTargetPath({
              targets: ['locked/secret.ts'],
              cwd: scene.cwd,
            }),
          );
          expect(getFsErrorCode(error)).toEqual('EACCES');
        });
      });
    },
  );
});
