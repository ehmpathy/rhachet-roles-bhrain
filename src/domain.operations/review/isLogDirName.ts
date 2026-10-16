import { SHAPE_OF_LOG_DIR_NAME } from './genLogDirName';

/**
 * .what = tells whether a directory name was minted by `genLogDirName`
 * .why = the order of review log dirs is a lexical sort, chronological only
 *        for names this function admits — a hand-made dir (`zzz-debug`,
 *        `old`, `tmp`) sorts by its letters, so a late-alphabet name becomes
 *        "the latest run". and the row is not an error: `getOneReviewRunMeter`
 *        grades an artifact-less dir `refused`, which shows a measured `$0`
 *        for a scratch dir provably not a review (rule.forbid.failhide)
 *
 * .note = checks the head only — the pid and uuid that follow make a name
 *         unique, carry no order, and are not this predicate's business
 *
 * .note = the shape it tests is declared beside the mint, in
 *         `genLogDirName.ts`, so this predicate and the generator read one
 *         declaration and cannot drift
 */
export const isLogDirName = (input: { name: string }): boolean =>
  SHAPE_OF_LOG_DIR_NAME.test(input.name);
