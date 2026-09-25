import * as fs from 'fs/promises';
import { UnexpectedCodePathError } from 'helpful-errors';
import * as path from 'path';

import { isPathFound } from '../isPathFound';

/**
 * .what = the ordinals an archived name may take, in order: 0 is the bare name, then .1, .2, …
 * .why = a bound, so a pathological archive dir raises rather than loops forever
 */
const ARCHIVE_ORDINALS = Array.from({ length: 1000 }, (_, index) => index);

/**
 * .what = the name an archived file takes at a given collision ordinal
 * .why = ordinal 0 is the bare name, so the common case — no collision — reads as it always did
 */
const asArchiveCandidatePath = (input: {
  archiveDir: string;
  baseName: string;
  ordinal: number;
}): string =>
  path.join(
    input.archiveDir,
    input.ordinal === 0 ? input.baseName : `${input.baseName}.${input.ordinal}`,
  );

/**
 * .what = whether two paths name the SAME file — one inode reached by two links
 * .why = `fs.link` reports `EEXIST` for a name a *different* record already holds AND for a
 *        name THIS record already holds from a half-done prior move. only the inode parts
 *        the two, and the two want opposite responses (walk on, versus complete the move).
 *
 * .note = `dev` rides along with `ino` because an inode number is unique per device, never
 *         globally. both paths sit under one route dir today, so this is belt-and-braces.
 * .note = an absent path is not the same file. ENOENT is the honest answer here — the
 *         caller is mid-decision, and a race that removes either path means "walk on".
 *         every other error is a fault and reaches the caller (rule.forbid.failhide).
 */
const isSameInode = async (input: {
  a: string;
  b: string;
}): Promise<boolean> => {
  const stats = await Promise.all(
    [input.a, input.b].map((p) =>
      fs.stat(p).catch((error: NodeJS.ErrnoException) => {
        if (error.code === 'ENOENT') return null;
        throw error;
      }),
    ),
  );
  const [statA, statB] = stats;
  if (!statA || !statB) return false;
  return statA.dev === statB.dev && statA.ino === statB.ino;
};

/**
 * .what = moves one file into the archive dir, under a name no other caller holds
 * .why = the claim IS the create. `fs.link` fails EEXIST atomically if the name is taken, so
 *        there is no probe-then-act window for a second caller to slip through — the same
 *        discipline `setSelfReviewTriggeredReport` takes with its `wx` write.
 *
 * .note = a probe-then-`rename` was the extant shape, and it lost data two ways: two callers
 *         could both read "no collision" and both rename onto one path (`fs.rename` overwrites
 *         silently on POSIX), and the collision suffix was a wall clock at millisecond
 *         precision, so two archives inside one millisecond produced one name.
 * .note = the ordinal also keeps the archived name free of time precision
 *         (`rule.forbid.timestamps-in-route-artifacts`).
 * .note = `link` + `unlink` rather than `rename` because only `link` refuses an extant
 *         destination. both paths sit under the same route dir, so they share a filesystem.
 * .note = 🔴 the move is TWO syscalls, so a retry must recognize its own half-done work. an
 *         `EEXIST` whose target is the SAME inode as the source is a prior attempt whose
 *         unlink did not land — that name is already ours, so the retry completes the move
 *         rather than a walk to `.1` that leaves two archived copies of one record.
 */
const setFileIntoArchive = async (input: {
  file: string;
  archiveDir: string;
}): Promise<void> => {
  const baseName = path.basename(input.file);

  for (const ordinal of ARCHIVE_ORDINALS) {
    const archivePath = asArchiveCandidatePath({
      archiveDir: input.archiveDir,
      baseName,
      ordinal,
    });

    // claim the name. an EEXIST is a real collision; every other error is a fault, and a
    // fault must reach the caller rather than read as "that name is taken"
    //
    // 🔴 .note = an ENOENT here has TWO causes and only one is benign: the SOURCE vanished —
    //    a concurrent lane finished this very move — or the archive DIR vanished, which is a
    //    real fault. so the code alone cannot decide it; the source is asked directly. a bare
    //    `ENOENT` allowlist would read the second as the first (`rule.forbid.failhide`).
    const claimed = await fs
      .link(input.file, archivePath)
      .then(() => 'claimed' as const)
      .catch(async (error: NodeJS.ErrnoException) => {
        if (error.code === 'EEXIST') return 'taken' as const;
        if (error.code === 'ENOENT' && !(await isPathFound(input.file)))
          return 'moved' as const;
        throw error;
      });

    // a source that is gone is a move another lane already completed. there is naught left to
    // link and naught left to unlink, so the post-condition this operation promises already holds
    if (claimed === 'moved') return;

    // an extant name we already hold a link to is our own partial move, never a collision
    const isOurOwnPartialMove =
      claimed === 'taken' &&
      (await isSameInode({ a: input.file, b: archivePath }));

    // 🔴 a source that vanished MID-DECISION reads identically to a genuine collision:
    //    `isSameInode` answers `false` for both, because an absent path is not the same file.
    //    the two want opposite moves, so ask which one happened BEFORE the walk. without this
    //    the loop walks to the next ordinal and re-links a source that is gone — an ENOENT the
    //    allowlist above would then have to raise, and the whole rewind rejects on a race the
    //    `isSameInode` docblock itself calls benign
    //    (`arch-hazards-behavior` blocker.1 at i017; raised at i016 as r007 nitpick.2)
    if (claimed === 'taken' && !isOurOwnPartialMove) {
      // ⚠️ .note = UNCLAMPED, and deliberately so. `[case4]` stages an absent source and a
      //    taken name, and the kernel routes that to the ENOENT arm above rather than here —
      //    `fs.link` resolves the source before it examines the destination. to reach THIS
      //    line the source must be present at `fs.link` (so the error is EEXIST) and gone by
      //    `isSameInode`, which is a true interleave between two syscalls inside one call.
      //    staging it needs a seam this operation does not have. ⇒ the guard is
      //    correct-by-construction and unproven by test; stated rather than implied, since a
      //    clamp that never reaches its branch is worse than an absent one
      if (!(await isPathFound(input.file))) return;

      // a name a DIFFERENT record holds — walk to the next ordinal
      continue;
    }

    // the archive now holds the content; drop the source link to complete the move.
    // an absent source means a prior attempt already completed it — that is the move done,
    // never a fault. every other error leaves BOTH links live, so it is named and raised
    await fs.unlink(input.file).catch((error: NodeJS.ErrnoException) => {
      if (error.code === 'ENOENT') return;
      throw new UnexpectedCodePathError(
        'archived the file but could not drop the source link',
        { file: input.file, archivePath, reason: error.message },
      );
    });
    return;
  }

  throw new UnexpectedCodePathError('archive names exhausted for one file', {
    file: input.file,
    archiveDir: input.archiveDir,
    tried: ARCHIVE_ORDINALS.length,
  });
};

/**
 * .what = move a set of route files into `.route/.archive/`, with a collision suffix
 * .why = two operations archive on rewind — `archiveStoneYield` and
 *        `archiveStoneSelfReviewTriggers` — and each carried its own copy of this loop:
 *        the same archive dir, the same collision probe, the same suffix, the same move.
 *        one concept, two copies, no owner.
 *
 * .note = the caller owns ENUMERATION; this owns the MOVE. that is the whole seam — the
 *         two callers differ only in which files they hand over (a `$stone.yield*` glob
 *         vs a trigger-marker glob), and in naught else.
 * .note = a collision suffixes rather than overwrites. the archive is the only record a
 *         rewound round leaves, so a second rewind must not erase the first one's trace.
 * .note = `files` are absolute paths, as both enumerators already return them.
 */
export const archiveRouteFiles = async (input: {
  route: string;
  files: string[];
}): Promise<{ outcome: 'archived' | 'absent'; count: number }> => {
  // no files to move is a real outcome, never an error — a rewind may find naught
  if (input.files.length === 0) return { outcome: 'absent', count: 0 };

  // ensure the archive dir is found or created
  const archiveDir = path.join(input.route, '.route', '.archive');
  await fs.mkdir(archiveDir, { recursive: true });

  for (const file of input.files) {
    await setFileIntoArchive({ file, archiveDir });
  }

  return { outcome: 'archived', count: input.files.length };
};
