import type { ReviewRunMeter } from '@src/domain.objects/Reviewer/ReviewRunMeter';
import { asReviewLogsDir } from '@src/domain.operations/review/asReviewLogsDir';
import { getAllEntriesInDir } from '@src/domain.operations/review/getAllEntriesInDir';
import { asReviewRunDirs } from '@src/domain.operations/review/meter/asReviewRunDirs';
import { getOneReviewRunMeterOrDefect } from '@src/domain.operations/review/meter/getOneReviewRunMeterOrDefect';

/**
 * .what = meters the most recent review run under a repo's review log root
 * .why = `--of run` asks about ONE run, and the common case is the one that just
 *        ran. to meter the whole corpus and keep the last row would read every
 *        prompt on disk to answer a question about one of them — measured at ~2.8gb
 *        over a full corpus, where this reads kilobytes.
 *
 * .note = log dir names lead with an iso timestamp (`genLogDirName`), so a
 *         lexical sort is a chronological one — a name that does not sort
 *         chronologically would be reported as "the run that just ran" with no
 *         signal at all (rule.forbid.behavior-hazards). clamped rather than
 *         merely recorded: `genLogDirName.test.ts` `[case3]` asserts the
 *         property this operation depends on, across a date boundary included.
 *
 *         that same dependency is why this reuses `asReviewLogsDir` rather
 *         than re-derive the path.
 *
 * .note = answers null when no run is on disk. an absent root is the legitimate
 *         state of a tree where no review has run yet — a fact for the caller to
 *         render, never a fault.
 */
export const getOneReviewRunMeterLatest = async (input: {
  cwd: string;
  /** also place the target mass by directory — see `getOneReviewRunMeter` */
  withLocus: boolean;
}): Promise<{ root: string; run: ReviewRunMeter | null }> => {
  const root = asReviewLogsDir({ cwd: input.cwd });

  // an ABSENT root is the legitimate state of a tree that never reviewed; an
  // unreadable one is a defect, and `getAllEntriesInDir` keeps the two apart
  const entries = await getAllEntriesInDir({ at: root });
  if (entries === null) return { root, run: null };

  // run dirs only. `getOneReviewRunMeter` catches every absent artifact to a null
  // and grades the result `refused` — a nil spend that is a fact — so a stray
  // file handed to it would enter the census as a real run that measurably cost
  // nil, and here the harm is total: only one row is reported, and a file whose
  // name sorts last becomes "the latest run" (rule.forbid.failhide, clamped by
  // `[case1]` beside this file).
  //
  // and only dirs this repo minted. a lexical sort is chronological for a
  // `genLogDirName` name and for no other, so a hand-made `zzz-debug` would sort
  // last and become "the latest run", and then render `refused` over a dir that
  // was never a review at all. the predicate lives beside the mint so the two
  // cannot drift (rule.forbid.failhide, clamped by `[case4]` beside this file).
  // one home for "what is a run dir": the same `asReviewRunDirs` the corpus scan reads
  const dirs = asReviewRunDirs({ root, entries });

  const dir = dirs[dirs.length - 1];
  if (dir === undefined) return { root, run: null };

  // a corrupt artifact in the run asked about is reported as an `unknown` row that
  // names its defect; a defect in the meter's own code rethrows as itself
  // (getOneReviewRunMeterOrDefect)
  return {
    root,
    run: await getOneReviewRunMeterOrDefect({
      dir,
      withLocus: input.withLocus,
    }),
  };
};
