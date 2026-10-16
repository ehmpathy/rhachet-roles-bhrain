import * as path from 'path';

import { isLogDirName } from '@src/domain.operations/review/isLogDirName';

/**
 * .what = tells whether a path names one review run's log dir, rather than a tree
 * .why = `--at` answers one question — where to read — and a run is as
 *        legitimate an answer as a tree. the discriminator is a fact about
 *        the path, never a flag the caller sets: a caller who must declare
 *        which kind of dir they handed over can declare it wrong. so it
 *        reads the basename against the mint grammar — a dir this repo
 *        minted is a run, every other dir is a tree, and no caller is asked
 *
 * .note = reuses `isLogDirName` rather than re-derive the shape — a second
 *         copy would drift from the mint: a stricter copy reads a real run
 *         dir as a tree, a looser one reads a scratch dir as a run and meters
 *         it `refused`, which reports a measured `$0` over a dir that was
 *         never a review (rule.forbid.failhide)
 *
 * .note = pure — a claim about the name, never about the disk. presence is a
 *         separate question (`isPathPresent`); a fold of the two would make
 *         an absent run dir indistinguishable from a tree
 */
export const isReviewRunDir = (input: { at: string }): boolean =>
  // `path.basename` strips trailing separators, so a shell tab-completion that
  // hands over `…/2026-09-23T…Z.pid1.abc/` reads the same as one that does not
  isLogDirName({ name: path.basename(input.at) });
