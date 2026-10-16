import * as path from 'path';

import type { ReviewRunMeter } from '@src/domain.objects/Reviewer/ReviewRunMeter';
import { isPathPresent } from '@src/domain.operations/review/isPathPresent';
import { isReviewRunDir } from '@src/domain.operations/review/isReviewRunDir';
import { getOneReviewRunMeterLatest } from '@src/domain.operations/review/meter/getOneReviewRunMeterLatest';
import { getOneReviewRunMeterOrDefect } from '@src/domain.operations/review/meter/getOneReviewRunMeterOrDefect';

/**
 * .what = meters ONE review run, from a path that may name a TREE or a RUN
 * .why = `--of run` could only reach a tree's latest, so any historical run had
 *        no surface at all — and it is the one breadth that carries composition,
 *        so "which input bought the prompt of the round that regressed?" was
 *        unanswerable about any round but the newest.
 *
 *        `--at` already means "where do i read?", and a run dir is a legitimate
 *        answer to that question, so the path says which is meant
 *        (`isReviewRunDir`), never the caller.
 *
 * .note = presence is checked before the meter. `getOneReviewRunMeter` catches
 *         every absent artifact to a null and grades the result `refused` — a
 *         nil spend that is a fact, which renders `$0`. a mistyped run path
 *         handed straight to it would report a review that provably cost
 *         naught, over a directory that does not exist.
 *
 *         the tree branch has no such hazard, since `getAllEntriesInDir` already
 *         parts an absent root from an unreadable one — the run branch owes its
 *         own guard for that asymmetry.
 *
 * .note = `root` answers "the log root this run sits under" in both branches, so
 *         a `--json` consumer reads one field with one sense whichever dir was
 *         named. for a run dir that is its parent, since `stepReview` mints
 *         every run dir directly under the root.
 */
export const getOneReviewRunMeterAt = async (input: {
  at: string;
  /**
   * also place the target mass by directory — see `getOneReviewRunMeter`
   *
   * .note = this breadth is the one that can afford it: it reads ONE run, so the
   *         extra read of the rendered prompt is a single file rather than one per
   *         run of a corpus. threaded rather than defaulted on, so a `--json`
   *         consumer that wants the cheap read can still have it.
   */
  withLocus: boolean;
}): Promise<{ root: string; run: ReviewRunMeter | null }> => {
  // a path that does not NAME a run is a tree, and a tree's `--of run` is its
  // latest — the extant behavior, unchanged
  if (!isReviewRunDir({ at: input.at }))
    return await getOneReviewRunMeterLatest({
      cwd: input.at,
      withLocus: input.withLocus,
    });

  const dir = path.resolve(input.at);
  const root = path.dirname(dir);

  // an absent run dir answers null, so the caller refuses with "no review run to
  // price" rather than render a measured `$0` over a path that is not there
  if (!(await isPathPresent({ at: dir }))) return { root, run: null };

  // a corrupt artifact inside a run the caller NAMED is reported as an `unknown`
  // row that carries its defect, never a stack trace with no report at all
  // .note = only an ARTIFACT defect becomes a row; a defect in the meter's own code
  //         rethrows as itself (getOneReviewRunMeterOrDefect)
  return {
    root,
    run: await getOneReviewRunMeterOrDefect({
      dir,
      withLocus: input.withLocus,
    }),
  };
};
