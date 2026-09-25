import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { getError, given, then, useBeforeAll, when } from 'test-fns';

import { isPathFound } from './isPathFound';

/**
 * .what = integration cases for isPathFound
 * .why = it reads the filesystem, so a unit test cannot exercise the one property that
 *        matters — that a NON-ENOENT fault raises rather than reads as absence
 *        (`rule.forbid.unit.remote-boundaries`)
 *
 * 🔴 .note = [case3] is the clamp for the defect this operation exists to prevent. under the
 *            bare `.catch(() => false)` it went GREEN, since the probe answered `false`; the
 *            assertion here demands a THROW, so it goes red the moment the allowlist widens
 *            (`rule.require.clamp-edge-cases` — bite-checked by revert).
 */
describe('isPathFound', () => {
  const scene = useBeforeAll(async () => {
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'isPathFound-'));
    const filePresent = path.join(tempDir, 'present.md');
    await fs.writeFile(filePresent, 'here');

    // a path whose PARENT is a file, never a dir — a read through it raises ENOTDIR,
    // which is the fault class a bare catch would have read as "absent"
    const pathThroughAFile = path.join(filePresent, 'child.md');

    return { tempDir, filePresent, pathThroughAFile };
  });

  given('[case1] a path that is present', () => {
    when('[t0] probed', () => {
      then('it answers found', async () => {
        expect(await isPathFound(scene.filePresent)).toEqual(true);
      });
    });
  });

  given('[case2] a path that is genuinely absent', () => {
    when('[t0] probed', () => {
      then('it answers absent, never a throw', async () => {
        const absent = path.join(scene.tempDir, 'never-written.md');
        expect(await isPathFound(absent)).toEqual(false);
      });
    });
  });

  given('[case3] a path whose parent is a file rather than a dir', () => {
    when('[t0] probed', () => {
      then('the ENOTDIR fault RAISES — it never reads as absence', async () => {
        const error = await getError(isPathFound(scene.pathThroughAFile));

        // 🔴 .note = no `toBeInstanceOf(Error)` here. the fault is minted by node's INTERNAL
        //            realm, so its constructor is a different `Error` than the one a jest vm
        //            context holds — the check reports `Expected: Error, Received: Error` and
        //            fails on a distinction that is no part of the claim. the `.code` and the
        //            message carry the whole claim, and both part it from `NoErrorThrownError`
        expect((error as NodeJS.ErrnoException).code).toEqual('ENOTDIR');
        expect((error as Error).message).toContain('ENOTDIR');
      });
    });
  });
});
