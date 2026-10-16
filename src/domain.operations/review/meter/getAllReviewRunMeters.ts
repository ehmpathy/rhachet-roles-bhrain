import type { ReviewRunMeter } from '@src/domain.objects/Reviewer/ReviewRunMeter';
import { asReviewLogsDir } from '@src/domain.operations/review/asReviewLogsDir';
import { getAllEntriesInDir } from '@src/domain.operations/review/getAllEntriesInDir';
import { asReviewRunDirs } from '@src/domain.operations/review/meter/asReviewRunDirs';
import { getOneReviewRunMeterOrDefect } from '@src/domain.operations/review/meter/getOneReviewRunMeterOrDefect';
import { getAllResultsInBoundedPool } from '@src/utils/getAllResultsInBoundedPool';

/**
 * .what = how many run dirs are metered at once
 * .why = each run reads its compiled prompt, and a review prompt runs to
 *        megabytes. an unbounded `Promise.all` holds every one in memory at
 *        once — a grove mine measurably died at a 2gb heap over ~20 trees. the
 *        bound caps the live set at roughly this many prompts, each discarded
 *        the moment its chars are counted.
 */
const BOUND_OF_CONCURRENT_RUNS = 8;

/**
 * .what = meters every review run under a repo's review log root
 * .why = a rate over one before/after pair proves naught about a distribution; the
 *        meter runs over the whole corpus so a reported rate is a rate over N
 *
 * .note = answers an empty list when the root is absent, rather than a throw. an
 *         absent root is the legitimate state of a tree where no review has run
 *         yet, a fact for the caller to render, never a fault. the CLI turns it
 *         into a refusal that names the fix.
 *
 * .note = the log root is git-ignored ephemera, local to the machine that ran
 *         the review, so this meter reports on this tree's reviews only. a
 *         grove-wide figure must be taken where the reviews ran.
 */
export const getAllReviewRunMeters = async (input: {
  cwd: string;
}): Promise<{ root: string; runs: ReviewRunMeter[] }> => {
  const root = asReviewLogsDir({ cwd: input.cwd });

  // an absent root is the legitimate state of a tree that never reviewed; an
  // unreadable one is a defect, and `getAllEntriesInDir` keeps the two apart
  const entries = await getAllEntriesInDir({ at: root });
  if (entries === null) return { root, runs: [] };

  // run dirs only, and the mint grammar decides — never `.isDirectory()` alone.
  // `getOneReviewRunMeter` catches every absent artifact to a null and grades
  // the result `refused`, a nil spend that is a fact, so a path that was never
  // a review would enter the census as a real run that measurably cost nil —
  // the run count, and every rate taken over it, inflates
  // (rule.forbid.failhide).
  //
  // a directory check alone is not enough: it screens a stray file but admits
  // every stray dir — `old/`, `tmp/`, `zzz-debug/`, a gitignored scratch dir
  // made by hand — each of which would meter `refused` and render `$0` as a
  // fact about a dir nobody ever reviewed in. the predicate is shared with
  // `getOneReviewRunMeterLatest` rather than re-derived, since a second copy
  // drifts.
  //
  // clamped by `[case4]` (a stray file) and `[case8]` (a stray dir) of the
  // suite beside this file.
  const dirs = asReviewRunDirs({ root, entries });

  // pour the dirs in bounded waves, so the prompts a wave reads are freed before
  // the next wave allocates its own
  const runs = await getAllResultsInBoundedPool({
    items: dirs,
    bound: BOUND_OF_CONCURRENT_RUNS,
    // isolated per run. a corrupt artifact in one dir of hundreds must not
    // deny the report its other rows — the defective run is graded `unknown`
    // (absent, excluded from every sum) and names itself, where an unisolated
    // throw would abort the whole command into a stack trace
    // .note = only an artifact defect is isolated; a defect in the meter's own
    //         code rethrows as itself (isReviewRunArtifactDefect)
    map: (dir): Promise<ReviewRunMeter> =>
      getOneReviewRunMeterOrDefect({ dir, withLocus: false }),
  });

  return { root, runs };
};
