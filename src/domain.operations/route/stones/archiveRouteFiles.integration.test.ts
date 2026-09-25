import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { given, then, useBeforeAll, when } from 'test-fns';

import { isPathFound } from '../isPathFound';
import { archiveRouteFiles } from './archiveRouteFiles';

/**
 * .what = clamps that the archive never loses a record, however two callers interleave
 * .why = the archive is the ONLY trace a rewound round leaves. the extant shape probed with
 *        `fs.access` and then `fs.rename`d, which loses data two ways: two callers both read
 *        "no collision" and both rename onto one path (`rename` overwrites silently on POSIX),
 *        and the collision suffix was a wall clock at millisecond precision, so two archives
 *        inside one millisecond produced one name.
 *
 * ⚠️ .note = [case2] is the bite check. restore the probe-then-rename shape and it goes red at
 *            1 archived file rather than 4 — the three lost ones are unrecoverable.
 */
describe('archiveRouteFiles', () => {
  given('[case1] one file, and no prior archive', () => {
    const scene = useBeforeAll(async () => {
      const route = await fs.mkdtemp(path.join(os.tmpdir(), 'archive-plain-'));
      await fs.writeFile(path.join(route, 'a.md'), 'first');
      return { route };
    });

    when('[t0] it is archived', () => {
      then('it lands under its bare name', async () => {
        await archiveRouteFiles({
          route: scene.route,
          files: [path.join(scene.route, 'a.md')],
        });

        const archived = await fs.readFile(
          path.join(scene.route, '.route', '.archive', 'a.md'),
          'utf-8',
        );
        expect(archived).toEqual('first');
      });

      then('the source is gone', async () => {
        const sourceFound = await fs
          .access(path.join(scene.route, 'a.md'))
          .then(() => true)
          .catch((error: NodeJS.ErrnoException) => {
            if (error.code === 'ENOENT') return false;
            throw error;
          });
        expect(sourceFound).toEqual(false);
      });
    });
  });

  given('[case2] FOUR callers archive one basename, concurrently', () => {
    const scene = useBeforeAll(async () => {
      const route = await fs.mkdtemp(path.join(os.tmpdir(), 'archive-race-'));

      // four sources, one basename each, in four peer dirs — so every caller targets the
      // SAME archived name and the archive must keep all four apart
      const sources = await Promise.all(
        ['w', 'x', 'y', 'z'].map(async (tag) => {
          const dir = path.join(route, tag);
          await fs.mkdir(dir, { recursive: true });
          const file = path.join(dir, 'a.md');
          await fs.writeFile(file, tag);
          return file;
        }),
      );

      return { route, sources };
    });

    when('[t0] all four archive with no await between them', () => {
      /**
       * ⚠️ the bite: under probe-then-rename all four probes read "no collision" in the same
       *    tick, all four rename onto `.archive/a.md`, and three contents are destroyed.
       *    `fs.link` refuses an extant name atomically, so exactly one caller may hold each
       *    ordinal and the losers walk to the next one.
       */
      then('every record survives, under four distinct names', async () => {
        await Promise.all(
          scene.sources.map((file) =>
            archiveRouteFiles({ route: scene.route, files: [file] }),
          ),
        );

        const archiveDir = path.join(scene.route, '.route', '.archive');
        const names = await fs.readdir(archiveDir);
        expect(names.length).toEqual(4);

        const contents = await Promise.all(
          names.map((name) =>
            fs.readFile(path.join(archiveDir, name), 'utf-8'),
          ),
        );
        expect(contents.sort()).toEqual(['w', 'x', 'y', 'z']);
      });

      then('the suffixes are ordinals, with no time precision', async () => {
        // .why = rule.forbid.timestamps-in-route-artifacts — a date is allowed, a clock is not
        const archiveDir = path.join(scene.route, '.route', '.archive');
        const names = await fs.readdir(archiveDir);
        expect(names.sort()).toEqual(['a.md', 'a.md.1', 'a.md.2', 'a.md.3']);
      });
    });
  });

  /**
   * .what = a retry over a HALF-DONE move — the link landed, the unlink did not
   * .why = the move is two syscalls, so a fault between them leaves a copy in the archive
   *        AND the source still present. a rewind that retries then globs the live source
   *        again, and the question is whether it completes the move or files a second copy
   *        of one record.
   *
   * ⚠️ .note = this is the bite check. drop the inode comparison and [t0] goes red at TWO
   *            archived names rather than one — the same record, filed twice, with no signal
   *            that the first attempt half-completed.
   */
  given('[case3] a retry over a move whose unlink never landed', () => {
    const scene = useBeforeAll(async () => {
      const route = await fs.mkdtemp(path.join(os.tmpdir(), 'archive-retry-'));
      const source = path.join(route, 'a.md');
      await fs.writeFile(source, 'the one record');

      // stage the partial state a failed unlink leaves: the archive holds a link, and the
      // source link is still live. exactly what `link` then a faulted `unlink` produces
      const archiveDir = path.join(route, '.route', '.archive');
      await fs.mkdir(archiveDir, { recursive: true });
      await fs.link(source, path.join(archiveDir, 'a.md'));

      return { route, source, archiveDir };
    });

    when('[t0] the rewind retries that same file', () => {
      then('the move completes rather than files a second copy', async () => {
        await archiveRouteFiles({
          route: scene.route,
          files: [scene.source],
        });

        const names = await fs.readdir(scene.archiveDir);
        expect(names).toEqual(['a.md']);
      });

      then('the source link is gone, so the move is done', async () => {
        expect(await isPathFound(scene.source)).toEqual(false);
      });

      then('the content is intact', async () => {
        const archived = await fs.readFile(
          path.join(scene.archiveDir, 'a.md'),
          'utf-8',
        );
        expect(archived).toEqual('the one record');
      });
    });
  });

  /**
   * 🔴 .what = the source is ALREADY GONE when the archive runs — a concurrent lane completed
   *            this very move, and a stale glob handed us its name anyway
   * .why = the claim's allowlist carried `EEXIST` alone, so a vanished source raised an ENOENT
   *        and the whole rewind rejected on a race the `isSameInode` docblock itself calls
   *        benign. the post-condition this operation promises — the record is in the archive
   *        and not at the source — ALREADY HOLDS, so the honest answer is to return
   *        (`arch-hazards-behavior` blocker.1 at i017; raised at i016 as r007 nitpick.2).
   *
   * 🔴 .note = the kernel decides WHICH branch this reaches, and it is not the one a first read
   *            expects. with the source absent AND the archive name taken, `fs.link` reports
   *            **ENOENT**, never `EEXIST` — it resolves the source before it examines the
   *            destination. ⇒ so this case clamps the `'moved'` arm of the tri-state claim,
   *            and it does NOT reach the mid-decision guard below it. measured by revert, not
   *            assumed: a first draft of this docblock claimed the guard, and the bite check
   *            went GREEN with the guard removed — the case had never touched it.
   *
   * ⚠️ .note = the state is STAGED rather than raced — the two things a finished lane leaves,
   *            an archive name held by a different inode and no source, are written directly.
   *            a real-clock race would be a flake with a microsecond window.
   *
   * 🔴 .note = this is the bite check. neuter the `ENOENT && !isPathFound` arm of the claim and
   *            [t0] goes red with an unhandled ENOENT (`rule.require.clamp-edge-cases`).
   */
  given('[case4] the source is already gone when the archive runs', () => {
    const scene = useBeforeAll(async () => {
      const route = await fs.mkdtemp(path.join(os.tmpdir(), 'archive-race-'));
      const source = path.join(route, 'a.md');
      const archiveDir = path.join(route, '.route', '.archive');
      await fs.mkdir(archiveDir, { recursive: true });

      // a DIFFERENT record already holds the bare name — so our link will EEXIST, and the
      // inode comparison will not match
      await fs.writeFile(
        path.join(archiveDir, 'a.md'),
        'another lane’s record',
      );

      // and the source is gone, exactly as a concurrent lane that completed this move leaves it
      return { route, source, archiveDir };
    });

    when('[t0] the rewind archives that file', () => {
      then('it walks on rather than raising', async () => {
        const result = await archiveRouteFiles({
          route: scene.route,
          files: [scene.source],
        });

        // the post-condition the operation promises already holds — the source is not there
        expect(result.outcome).toEqual('archived');
      });

      then('it files NO second copy of the other lane’s record', async () => {
        const names = await fs.readdir(scene.archiveDir);
        expect(names).toEqual(['a.md']);
      });

      then('the other lane’s content is untouched', async () => {
        const archived = await fs.readFile(
          path.join(scene.archiveDir, 'a.md'),
          'utf-8',
        );
        expect(archived).toEqual('another lane’s record');
      });
    });
  });
});
