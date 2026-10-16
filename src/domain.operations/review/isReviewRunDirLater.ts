import { asRunDirChronologicalOrder } from '@src/domain.operations/review/asRunDirChronologicalOrder';

/**
 * .what = whether `run` was minted strictly AFTER `than`, by the stamp its log dir leads with
 * .why = the one chronological law (`asRunDirChronologicalOrder`) answers both the sort and
 *        the "later" test, so a window and a supersede check cannot read time two ways
 */
export const isReviewRunDirLater = (input: {
  run: { dir: string };
  than: { dir: string };
}): boolean => asRunDirChronologicalOrder({ a: input.run, b: input.than }) > 0;
