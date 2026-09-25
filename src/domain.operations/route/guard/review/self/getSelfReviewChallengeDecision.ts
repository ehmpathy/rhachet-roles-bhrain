import * as fs from 'fs/promises';
import type { IsoTimeStamp } from 'iso-time';

import { findsertReviewSelfGitignore } from '../../../gitignore/findsertReviewSelfGitignore';
import { asComparablePath } from './asComparablePath';
import { asIsoTimeStampFromMtime } from './asIsoTimeStampFromMtime';
import { getSelfReviewArticulationPath } from './getSelfReviewArticulationPath';
import { getSelfReviewTriggeredReport } from './getSelfReviewTriggeredReport';
import { isArticulationStale } from './isArticulationStale';
import { isWithinHasteWindow } from './isWithinHasteWindow';
import { setSelfReviewTriggeredReport } from './setSelfReviewTriggeredReport';

/**
 * .what = the window inside which a promise is confronted about its haste
 * .why = a promise that lands this soon after the ask cannot have carried a read
 *
 * .note = it is a CUE threshold in the one sense that matters: it holds no driver for any
 *         DURATION. ⚠️ it is not free — `challenge:rushed` returns `challenged: true`, so the
 *         promise it meets is refused and must be re-run. the cost is one command, never a wait.
 *
 * 🔴 .note = the "at most once per slug" bound is won by `firstAdjudication` — the atomic `wx`
 *            create of the `.uptil` marker — and by that alone. this line named `attempts === 0`
 *            until 2026-09-20, which was a FALSE DOCUMENTED GUARANTEE: `.attempts` is a
 *            read-modify-write, it is declared a diagnostic in `setSelfReviewTriggeredReport`
 *            ("DO NOT BUILD A GATE ON IT"), and it may undercount under the same-slug fork this
 *            round exists to enable. ⇒ a maintainer who trusted the old line would have keyed the
 *            gate on the racy counter and got a cue that fires twice or never.
 *            found by `arch-hazards-behavior` at i014 (nitpick.3) and RE-RAISED at i015 as a
 *            blocker, because the round shipped a `.taken` and no repair.
 *
 * 🔴 .note = EXPORTED so every test derives its boundary from this value rather than re-types it.
 *            the number was hand-written at three sites until 2026-09-20 — here, a second
 *            `const WINDOW_MS = 30 * 1000` in `isWithinHasteWindow.test.ts`, and a bare
 *            `agoMs: 31 * 1000` in this operation's own test. ⇒ `F06` is an OPEN fulcrum that
 *            asks whether 30 is the right default, so the council may move it; a copy left
 *            behind would keep its old number, stay GREEN, and grade a boundary the gate no
 *            longer has. that is the round's own headline defect class, aimed at its one
 *            un-measured number.
 */
export const SELF_REVIEW_HASTE_WINDOW_MS = 30 * 1000;

/**
 * .what = decide if a promise is allowed, or confronted about its path, freshness, or haste
 * .why = encapsulates trigger lookup, path verdict, freshness verdict, and the haste cue
 *
 * .note = ORDER IS THE CONTRACT, and it inverts what it used to be:
 *   0. challenge:unasked  — no ask on record, so the adjudication has no datum at all
 *   1. challenge:mismatch — the declared path is not the owed path (a diff, both operands named)
 *   2. challenge:absent   — no file at the owed path (the path is named)
 *   3. challenge:stale    — the file predates the ask
 *   4. challenge:rushed   — the haste cue, and ONLY here
 *   5. allowed
 *
 *   the haste cue is LAST because of the D5 invariant: no confrontation about a rush may
 *   refuse a promise whose real defect is a path. a driver told to slow down when their
 *   file sits at the wrong path learns the wrong lesson and pays a round trip for the right one.
 *
 * 🔴 .note = `challenge:unasked` outranks even the path verdict, and the reason is the mirror
 *            of D5's rather than an exception to it. D5 ranks a verdict the driver can ACT on
 *            above one they cannot; here the driver's one move is the same whatever the path
 *            says — re-ask — and the ask's own emit then hands them the owed path. so a path
 *            report first would cost a round trip to learn a lesson the next command supersedes.
 *
 * .note = ⚠️ elapsed time IS half of one verdict, and that verdict refuses a promise. state it
 *         precisely, because a looser claim was on this docblock and the code falsified it:
 *         a promise is refused for haste AT MOST ONCE PER SLUG, and only inside the window of
 *         the ask. the refusal costs one command and no wait. a driver who has read for forty
 *         minutes clears on their first command; a driver who promises in eight seconds meets a
 *         paragraph and clears on their second.
 *
 * .note = the haste cue fires iff `firstAdjudication ∧ elapsed-since-the-ask < window`.
 *         `firstAdjudication` bounds it to once per slug, so it can never become a wall.
 *         `elapsed < window` targets it, so the thorough driver never meets it at all.
 *
 * 🔴 .note = the first half is the ATOMIC claim, NEVER the `attempts` counter, and the two are
 *            not interchangeable under the fork this round enables. `firstAdjudication` is won
 *            by an exclusive create (`wx`), which the OS grants to exactly one caller whatever
 *            the concurrency; `attempts` is a read-modify-write, so two lanes that promise one
 *            slug in the same instant can both read N and both write N+1 — and a cue keyed on
 *            that could fire twice, or never. ⇒ the write is performed BEFORE the decision, so
 *            the gate reads a claim it has already won rather than a count it is about to make.
 *            `attempts` remains as a DIAGNOSTIC that no gate reads.
 */
export const getSelfReviewChallengeDecision = async (input: {
  stone: string;
  slug: string;
  route: string;
  /**
   * .what = the path the driver declares they wrote to
   * .why = a check with one operand reports a failure; it takes two to report a difference
   */
  into: string;
}): Promise<{
  decision:
    | 'allowed'
    | 'challenge:unasked'
    | 'challenge:mismatch'
    | 'challenge:absent'
    | 'challenge:stale'
    | 'challenge:rushed';
  articulationPath: string;
  declaredPath?: string;
  articulationMtime?: IsoTimeStamp;
  askedAt?: IsoTimeStamp;
}> => {
  // compute the path the guard checks
  const articulationPath = getSelfReviewArticulationPath({
    route: input.route,
    stone: input.stone,
    slug: input.slug,
  });

  // ensure review/self/.gitignore found or created before the driver writes
  await findsertReviewSelfGitignore({ route: input.route });

  // lookup the trigger report for this (stone, slug) — hashless, so a repair cannot reset it
  const report = await getSelfReviewTriggeredReport(input);

  // 🔴 the ask is the PRECONDITION of the whole adjudication, so it is read first and before
  // any call that writes. with no `.since` on disk both later gates are inert — the freshness bar
  // is skipped outright (`report && …`) and the haste cue reads a null `askedAt` — so a promise
  // that fell through here would clear on two gates that COULD NOT RUN rather than two that passed
  // 🔴 .why it is REACHABLE = a rewind archives every `.since`/`.uptil` for a stone in one move,
  //    and the natural next act of a driver who holds the slug is to re-promise it; the hashless
  //    promise is advertised as a firm checkpoint, so no line of the design says the ask must be
  //    re-minted first
  // 🔴 .what it prevents = a LAUNDERED ask. absent this verdict the adjudication mints a fresh
  //    `.since` dated now, so a pre-rewind articulation reads as fresh against a timestamp that
  //    postdates it — the exact defect the freshness bar exists to catch, entered from the other side
  if (!report) {
    return { decision: 'challenge:unasked', articulationPath };
  }

  // the declared path and the computed path must agree.
  // checked FIRST, and with both operands in hand, so the emit renders a diff rather than
  // an `absent` that names only where the guard looked
  if (asComparablePath(input.into) !== asComparablePath(articulationPath)) {
    return {
      decision: 'challenge:mismatch',
      articulationPath,
      declaredPath: input.into,
    };
  }

  // the file must be at the owed path
  const articulationStat = await fs
    .stat(articulationPath)
    .catch((error: NodeJS.ErrnoException) => {
      if (error.code === 'ENOENT') return null;
      throw error;
    });
  if (!articulationStat) {
    return { decision: 'challenge:absent', articulationPath };
  }

  // the file must post-date the ask.
  // .note = the datum is the TRIGGER's mtime, never the artifact's: the question is
  //         "was this written for the review we asked for?", and only the ask dates that.
  // .note = `report` is non-null by the precondition above, so this reads the ask directly.
  //         it carried a `report &&` conjunct until the `challenge:unasked` verdict landed —
  //         and that conjunct was the defect's other half: it made the bar SKIP on a null ask
  //         rather than refuse, so the skip read as a pass
  if (
    isArticulationStale({
      articulatedAt: articulationStat.mtime,
      askedAt: report.sinceMtime,
    })
  ) {
    return {
      decision: 'challenge:stale',
      articulationPath,
      articulationMtime: asIsoTimeStampFromMtime(articulationStat.mtime),
      askedAt: asIsoTimeStampFromMtime(report.sinceMtime),
    };
  }

  // this promise was adjudicated, so it claims its first-ness and burns an attempt.
  // 🔴 the write comes BEFORE the decision, never after: `firstAdjudication` is won by an
  // atomic exclusive create, so it is the only sense of "first" that survives the fork
  const { firstAdjudication } = await setSelfReviewTriggeredReport(input);

  // the haste cue — last, and only after every path verdict has passed.
  // it fires at most once per slug, and only for a promise inside the window of the ask
  const isRushed = isWithinHasteWindow({
    firstAdjudication,
    askedAt: report.sinceMtime,
    windowMs: SELF_REVIEW_HASTE_WINDOW_MS,
  });

  if (isRushed) {
    return { decision: 'challenge:rushed', articulationPath };
  }

  return { decision: 'allowed', articulationPath };
};
