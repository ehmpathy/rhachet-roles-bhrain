import * as fs from 'fs/promises';
import { UnexpectedCodePathError } from 'helpful-errors';

import { asAttemptCount } from './asAttemptCount';
import { getSelfReviewTriggeredPaths } from './getSelfReviewTriggeredPaths';

/**
 * .what = get the ask's mtime from the .since marker, plus the attempts count
 * .why = enables the elapsed-since-the-ask read the haste cue takes, and the freshness bar
 *
 * .note = the key is (stone, slug) — hashless. see getSelfReviewTriggeredPaths for why.
 * .note = attempts defaults to 0 when absent: the ask mints .since and burns no attempt.
 *         only a promise the guard adjudicates increments it.
 *
 * 🔴 .note = it returned a `uptilMtime` until 2026-09-20, and NO gate ever read it. it was a
 *            vestige of the clock design this round retired: rush was once detected by a
 *            .since-vs-.uptil mtime comparison, and is now `firstAdjudication ∧ elapsed < 30s`
 *            read off .since alone. the field cost an `fs.stat` per gate check, plus an
 *            ENOENT fallback and the case that graded it. ⇒ removed with its subject, never
 *            around it — the `.uptil` FILE is untouched and still carries the load, since its
 *            exclusive `wx` create is what wins `firstAdjudication`. only its MTIME was dead
 *
 * 🔴 .note = `null` means ABSENT, and it may never mean UNREADABLE. a bare catch here conflates
 *            the two, and the conflation opens the gate: a null report makes elapsed read as
 *            Infinity (so the haste cue cannot fire) and skips the freshness bar entirely
 *            (so a stale articulation clears). ⇒ EACCES, EISDIR, or an EMFILE under a fork of M
 *            lanes would each turn a gate into a pass, silently.
 *            so every catch below allowlists its error and rethrows the rest
 *            (`rule.forbid.failhide`), exactly as getSelfReviewChallengeDecision already does.
 */
export const getSelfReviewTriggeredReport = async (input: {
  stone: string;
  slug: string;
  route: string;
}): Promise<{
  sinceMtime: Date;
  attempts: number;
} | null> => {
  // compute marker file paths
  const { sincePath, attemptsPath } = getSelfReviewTriggeredPaths(input);

  // read the ask's stat. an ENOENT is the real absence; every other
  // error is a fault, and a fault must reach the driver rather than read as "no ask"
  const sinceStat = await fs
    .stat(sincePath)
    .catch((error: NodeJS.ErrnoException) => {
      if (error.code === 'ENOENT') return null;
      throw error;
    });
  if (!sinceStat) return null;

  // 🔴 an ask is a FILE, and this check is explicit because it used to be accidental. the tally
  // lived in `.since` until 2026-09-20, so this operation read the marker's bytes too — and
  // `fs.readFile` on a directory raises EISDIR, which is what made a directory-at-the-path fault
  // rather than pass. once the tally moved to `.attempts` that read went away, and `fs.stat`
  // SUCCEEDS on a directory ⇒ an unreadable marker would have returned a report dated by a
  // directory's mtime, which `null`-means-ABSENT's twin invariant forbids: a report may never
  // mean UNREADABLE either. caught by `[case6]`, whose own docblock names the mechanism the
  // removal took away.
  if (!sinceStat.isFile())
    throw new UnexpectedCodePathError(
      'the self-review ask marker is not a file. its mtime dates the ask, and a directory dates no ask',
      { stone: input.stone, slug: input.slug, sincePath },
    );

  // 🔴 read the tally from its OWN marker, never from `.since`'s bytes. the two live in separate
  // files so that a tally write can never touch the mtime this operation just read — see
  // `getSelfReviewTriggeredPaths` for the two hazards that shape bought.
  // an absent `.attempts` is 0: the ask mints `.since` alone and burns no attempt
  const attemptsContent = await fs
    .readFile(attemptsPath, 'utf-8')
    .catch((error: NodeJS.ErrnoException) => {
      if (error.code === 'ENOENT') return '';
      throw error;
    });

  return {
    sinceMtime: sinceStat.mtime,
    attempts: asAttemptCount(attemptsContent),
  };
};
