import * as fs from 'fs/promises';
import { BadRequestError, getError } from 'helpful-errors';
import * as os from 'os';
import * as path from 'path';
import { given, then, useBeforeAll, when } from 'test-fns';

import { getAllEntriesInDir } from '@src/domain.operations/review/getAllEntriesInDir';
import { getOneFileText } from '@src/domain.operations/review/getOneFileText';
import { isPathPresent } from '@src/domain.operations/review/isPathPresent';
import { getFsErrorCode } from '@src/utils/fs/getFsErrorCode';
import { isErrorOfAbsence } from '@src/utils/fs/isErrorOfAbsence';

/**
 * .what = integration tests for the three fs readers that share one absence allowlist
 * .why = 🔴 these three decide, for every meter and grove surface, whether a path
 *        that could not be read enters the census as a MEASURED nil. the whole
 *        honesty of the cost report rests on them, so they are clamped over real
 *        files in a real temp dir — no mocks (rule.forbid.unit.remote-boundaries).
 *
 * .note = the unreadable cases chmod a PARENT dir to 0o000. a stat/readdir/access on
 *         a child is taken against the parent's permissions, so this yields EACCES on
 *         a path that plainly exists — the exact shape a bare catch reads as "absent".
 */
describe('isErrorOfAbsence.integration', () => {
  const scene = useBeforeAll(async () => {
    const cwd = path.join(
      os.tmpdir(),
      `int-absence-${Date.now()}-${process.pid}`,
    );
    const locked = path.join(cwd, 'locked');
    await fs.mkdir(locked, { recursive: true });
    await fs.writeFile(path.join(locked, 'secret.json'), '{"a":1}\n');
    await fs.mkdir(path.join(locked, 'sub'), { recursive: true });
    await fs.chmod(locked, 0o000);

    // fail fast where the runner bypasses file perms (root): the lock would not bite,
    // so every case below would fail for a reason unrelated to the behavior it grades
    const bypassed = await fs.readdir(locked).then(
      () => true,
      () => false,
    );
    if (bypassed) {
      await fs.chmod(locked, 0o755);
      throw new BadRequestError('this runner reads a 0o000 dir', {
        hint: 'run the integration suite as a non-root user',
        uid: process.getuid?.() ?? null,
      });
    }

    return { cwd, locked };
  });

  // restore the lock, then remove the tree, so no 0o000 dir is left behind to
  // block a later scan of the temp root
  afterAll(async () => {
    await fs.chmod(scene.locked, 0o755);
    await fs.rm(scene.cwd, { recursive: true, force: true });
  });

  given('[case1] a path that is genuinely not there', () => {
    when('[t0] each reader is asked for it', () => {
      then('the dir read answers null rather than a throw', async () => {
        const found = await getAllEntriesInDir({
          at: path.join(scene.cwd, 'vanished'),
        });
        expect(found).toEqual(null);
      });

      then('the file read answers null rather than a throw', async () => {
        const found = await getOneFileText({
          at: path.join(scene.cwd, 'vanished.json'),
        });
        expect(found).toEqual(null);
      });

      then('the presence check answers false rather than a throw', async () => {
        const found = await isPathPresent({
          at: path.join(scene.cwd, 'vanished.json'),
        });
        expect(found).toEqual(false);
      });
    });
  });

  given('[case2] a path that is present and cannot be read', () => {
    /**
     * 🔴 the failhide this clamps. under a bare `.catch(() => null)` each of these
     * three answers the ABSENT sentinel, and downstream that sentinel picks the
     * `refused` grade — which renders `$0`. so a permission denial becomes a
     * confident zero in a cost report (rule.forbid.failhide).
     */
    when('[t0] each reader is asked for it', () => {
      then(
        '🔴 the dir read THROWS rather than report an empty corpus',
        async () => {
          const error = await getError(
            getAllEntriesInDir({ at: path.join(scene.locked, 'sub') }),
          );
          // 🔴 the DENIAL rethrows untouched, where every other non-absence
          // errno takes the wrap. the errno must survive on the SHAPE, or the
          // cli that refuses on a barred read is left to pattern-match prose
          // off a message (`isErrorOfDenial`, `review._.cost`).
          //
          // ⇒ the claim of this case is unchanged — it THROWS rather than
          // answer an empty corpus — and the raw error names the path too
          expect(error.message).toContain('EACCES');
          expect(getFsErrorCode(error)).toEqual('EACCES');
          expect(error.message).toContain('sub');
        },
      );

      then(
        '🔴 the file read THROWS rather than report an absent artifact',
        async () => {
          const error = await getError(
            getOneFileText({ at: path.join(scene.locked, 'secret.json') }),
          );
          expect(error.message).toContain('could not read a file');
          expect(JSON.stringify(error)).toContain('secret.json');
        },
      );

      then(
        '🔴 the presence check THROWS rather than answer a confident false',
        async () => {
          const error = await getError(
            isPathPresent({ at: path.join(scene.locked, 'secret.json') }),
          );
          expect(error.message).toContain(
            'could not tell whether a path is there',
          );
          expect(JSON.stringify(error)).toContain('secret.json');
        },
      );
    });
  });

  given('[case3] a path whose parent is a file, not a dir', () => {
    /**
     * a read through a file answers ENOTDIR — the path cannot be there, since no dir
     * holds it, so it is an absence, never a denial nor a defect
     */
    const parent = useBeforeAll(async () => {
      const at = path.join(scene.cwd, 'plain.txt');
      await fs.writeFile(at, 'a file, not a dir\n');
      return { at };
    });

    when('[t0] each reader is asked for a child of that file', () => {
      then('the dir read answers null rather than a throw', async () => {
        const found = await getAllEntriesInDir({
          at: path.join(parent.at, 'child'),
        });
        expect(found).toEqual(null);
      });

      then('the file read answers null rather than a throw', async () => {
        const found = await getOneFileText({
          at: path.join(parent.at, 'child.json'),
        });
        expect(found).toEqual(null);
      });

      then('the presence check answers false rather than a throw', async () => {
        const found = await isPathPresent({
          at: path.join(parent.at, 'child.json'),
        });
        expect(found).toEqual(false);
      });

      then('the raw rejection is graded an absence', async () => {
        // the raw node rejection, caught as-is, so its own `code` field survives
        const error: unknown = await fs
          .readFile(path.join(parent.at, 'child.json'))
          .then(
            () => null,
            (rejection: unknown) => rejection,
          );
        expect(getFsErrorCode(error)).toEqual('ENOTDIR');
        expect(isErrorOfAbsence({ error })).toEqual(true);
      });
    });
  });

  given('[case4] a throw that carries no errno at all', () => {
    when('[t0] a programmer error reaches the allowlist', () => {
      then('it is NOT graded an absence', () => {
        // a TypeError has no `code`, so it must never read as "the path is not
        // there" — a programmer error that arrives as an empty corpus is the
        // failhide one level deeper
        expect(isErrorOfAbsence({ error: new TypeError('boom') })).toEqual(
          false,
        );
      });
    });
  });
});
